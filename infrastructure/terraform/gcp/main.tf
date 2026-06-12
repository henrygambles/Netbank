terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  backend "gcs" {
    bucket = "netbank-terraform-state"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ─── Variables ────────────────────────────────────────────────────────────────

variable "project_id" {
  description = "GCP project ID"
  type        = string
  default     = "netbank-prod"
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "europe-west2"
}

variable "db_password" {
  description = "PostgreSQL password"
  type        = string
  sensitive   = true
}

# ─── APIs ─────────────────────────────────────────────────────────────────────

resource "google_project_service" "services" {
  for_each = toset([
    "run.googleapis.com",
    "sql-component.googleapis.com",
    "sqladmin.googleapis.com",
    "redis.googleapis.com",
    "secretmanager.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
  ])
  service = each.value
  disable_on_destroy = false
}

# ─── Artifact Registry ────────────────────────────────────────────────────────

resource "google_artifact_registry_repository" "netbank" {
  location      = var.region
  repository_id = "netbank"
  format        = "DOCKER"
  depends_on    = [google_project_service.services]
}

# ─── Cloud SQL (PostgreSQL) ───────────────────────────────────────────────────

resource "google_sql_database_instance" "netbank" {
  name             = "netbank-postgres"
  database_version = "POSTGRES_16"
  region           = var.region

  settings {
    tier              = "db-g1-small"
    availability_type = "REGIONAL"
    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      point_in_time_recovery_enabled = true
      retained_backups               = 7
    }
    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.netbank.id
    }
  }

  depends_on = [google_project_service.services]
}

resource "google_sql_database" "netbank" {
  name     = "netbank"
  instance = google_sql_database_instance.netbank.name
}

resource "google_sql_user" "netbank" {
  name     = "netbank"
  instance = google_sql_database_instance.netbank.name
  password = var.db_password
}

# ─── Memorystore Redis ────────────────────────────────────────────────────────

resource "google_redis_instance" "netbank" {
  name           = "netbank-redis"
  tier           = "STANDARD_HA"
  memory_size_gb = 1
  region         = var.region
  depends_on     = [google_project_service.services]
}

# ─── VPC Network ──────────────────────────────────────────────────────────────

resource "google_compute_network" "netbank" {
  name                    = "netbank-vpc"
  auto_create_subnetworks = true
}

# ─── Cloud Run (API Gateway) ──────────────────────────────────────────────────

resource "google_cloud_run_v2_service" "api_gateway" {
  name     = "netbank-api-gateway"
  location = var.region

  template {
    scaling {
      min_instance_count = 1
      max_instance_count = 10
    }
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/netbank/api-gateway:latest"
      resources {
        limits = { cpu = "2", memory = "1Gi" }
      }
      env {
        name  = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.database_url.secret_id
            version = "latest"
          }
        }
      }
      env {
        name  = "REDIS_URL"
        value = "redis://${google_redis_instance.netbank.host}:6379"
      }
    }
    vpc_access {
      network_interfaces { network = google_compute_network.netbank.id }
    }
  }

  depends_on = [google_project_service.services]
}

resource "google_cloud_run_v2_service_iam_member" "api_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.api_gateway.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ─── Secrets ──────────────────────────────────────────────────────────────────

resource "google_secret_manager_secret" "database_url" {
  secret_id = "database-url"
  replication { auto {} }
  depends_on = [google_project_service.services]
}

resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "jwt-secret"
  replication { auto {} }
}

resource "google_secret_manager_secret" "anthropic_api_key" {
  secret_id = "anthropic-api-key"
  replication { auto {} }
}

resource "google_secret_manager_secret" "encryption_key" {
  secret_id = "encryption-key"
  replication { auto {} }
}

# ─── Cloud Storage ────────────────────────────────────────────────────────────

resource "google_storage_bucket" "assets" {
  name          = "netbank-assets-${var.project_id}"
  location      = var.region
  force_destroy = false

  uniform_bucket_level_access = true

  cors {
    origin          = ["https://app.netbank.com"]
    method          = ["GET", "HEAD"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}

# ─── Outputs ──────────────────────────────────────────────────────────────────

output "api_url" {
  value = google_cloud_run_v2_service.api_gateway.uri
}

output "db_connection_name" {
  value = google_sql_database_instance.netbank.connection_name
}

output "redis_host" {
  value = google_redis_instance.netbank.host
}
