<div align="center">

<br />

<table align="center"><tr><td>

```
 ███╗   ██╗███████╗████████╗██████╗  █████╗ ███╗   ██╗██╗  ██╗
 ████╗  ██║██╔════╝╚══██╔══╝██╔══██╗██╔══██╗████╗  ██║██║ ██╔╝
 ██╔██╗ ██║█████╗     ██║   ██████╔╝███████║██╔██╗ ██║█████╔╝ 
 ██║╚██╗██║██╔══╝     ██║   ██╔══██╗██╔══██║██║╚██╗██║██╔═██╗ 
 ██║ ╚████║███████╗   ██║   ██████╔╝██║  ██║██║ ╚████║██║  ██╗
 ╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝
```

</td></tr></table>

### Banking built for humans. Not spreadsheets. 🌅

### The future of money is open, kind, and closer than you think. ✨

<br />

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-e0234e?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?style=flat-square&logo=expo&logoColor=white)](https://expo.dev/)
[![Turborepo](https://img.shields.io/badge/Turborepo-monorepo-ef4444?style=flat-square&logo=turborepo&logoColor=white)](https://turbo.build/)
[![License: MIT](https://img.shields.io/badge/License-MIT-ff3465?style=flat-square)](LICENSE)

<br />

<img src="screenshots/hero.png" alt="Netbank web and mobile app screenshots" width="800" />

<br />

</div>

---

## ✦ What is Netbank?

Netbank is a **full-stack digital banking platform** — beautiful on the surface, serious underneath. It combines a Next.js web app, a React Native mobile app, and a NestJS microservices backend into a single, cohesive monorepo. Every screen has been crafted with care. Every API has been designed to last.

We believe banking is entering its best decade yet. 🚀 Open banking means your money is finally *yours* to move, connect, and understand — not locked behind one institution's walls. AI means a real financial companion in your pocket, not just a ledger. Community finance means the person next to you can be your portfolio, not a stranger's fund.

Netbank is our bet on what that future looks like, built today.

<br />

> *"Instead of your money sitting in a fund managed by someone in a glass tower, it goes directly to someone in your community."*

<br />

---

## 📸 Screenshots

<br />

<!-- Dashboard -->
<details>
<summary><b>🏦 Dashboard</b></summary>
<br />

> *Screenshots coming soon*

</details>

<!-- Invest -->
<details>
<summary><b>♥ Invest — Love thy neighbour</b></summary>
<br />

> *Screenshots coming soon*

</details>

<!-- Sabrina AI -->
<details>
<summary><b>✦ Sabrina — Your AI financial companion</b></summary>
<br />

> *Screenshots coming soon*

</details>

<!-- Crypto -->
<details>
<summary><b>₿ Crypto</b></summary>
<br />

> *Screenshots coming soon*

</details>

<!-- Mobile -->
<details>
<summary><b>📱 Mobile App</b></summary>
<br />

> *Screenshots coming soon*

</details>

<br />

---

## ✨ Features

### 🏦 Banking, reimagined
- **Real accounts** with live balances, sort codes, and account numbers
- **Instant transactions** with merchant categorisation and spend insights
- **Savings pots** — give your money a purpose, not just a number
- **Dark mode** that actually looks good

### 🔗 Open Banking — your whole financial life, one place
- **Connect any bank** via Plaid — no more twelve different apps
- Secure OAuth-based linking, your credentials never touch our servers
- Unified transaction feed across every account you connect
- The walled garden is coming down, one connection at a time 🌱

### ♥ Invest — Love thy neighbour
- **Community micro-investing** — put your money directly behind real people in your neighbourhood
- Back a local baker, a retiring teacher, a nursing student, a first-gen university student
- Earn interest while doing something that matters
- Nominate anyone — neighbours, local businesses, community projects

### ✦ Sabrina — AI financial companion
- Powered by **Claude (Anthropic)** — the most thoughtful AI in finance
- Real-time streaming chat — watch her think
- Knows your accounts, your transactions, your crypto, your pots
- Ask anything: *"How much did I spend on coffee last month?"* / *"Help me build a savings plan"*

### ₿ Crypto
- **Real wallets** — BTC, ETH, SOL, XMR and more
- Live market prices with 30-second refresh
- Portfolio tracking in GBP and USD
- Encrypted key storage

### 📱 Mobile-first
- React Native + Expo — one codebase, iOS and Android
- Smooth animations via Reanimated 4
- Biometric-ready auth
- Works offline with demo data fallback

<br />

---

## 🗺️ Architecture

```
netbank/
├── apps/
│   ├── web/                  # Next.js 15 App Router  (port 3100)
│   └── mobile/               # React Native + Expo SDK 54
│
├── services/
│   ├── api-gateway/          # NestJS — the front door  (port 3000)
│   ├── auth/                 # JWT + OAuth (Google, Apple)
│   ├── accounts/             # Ledger & balances
│   ├── transactions/         # Payments & history
│   ├── crypto/               # Wallets & live prices
│   ├── sabrina/              # AI chat (Anthropic Claude)
│   └── notifications/        # Push & in-app alerts
│
└── packages/
    ├── types/                # Shared TypeScript types
    ├── ui/                   # Shared component library
    └── config/               # ESLint, TSConfig, etc.
```

Built as a **Turborepo monorepo** with `pnpm` workspaces. All packages share types. All services share config. Nothing is duplicated.

<br />

---

## 🛠️ Tech stack

| Layer | Technology |
|---|---|
| **Web frontend** | Next.js 15, React 19, Tailwind CSS, Framer Motion |
| **Mobile** | React Native 0.81, Expo SDK 54, Reanimated 4 |
| **API gateway** | NestJS 10, Passport, JWT, SSE streaming |
| **Database** | PostgreSQL + Prisma ORM |
| **Cache** | Redis |
| **AI** | Anthropic Claude (streaming via SSE) |
| **Auth** | JWT (15m access / 30d refresh) + Google OAuth + Apple Sign-In |
| **State** | Zustand + TanStack Query |
| **Monorepo** | Turborepo + pnpm workspaces |
| **Infrastructure** | GCP (Cloud Run, Cloud SQL, GCS) + Terraform |

<br />

---

## 🚀 Getting started

### Prerequisites

- **Node.js** 20+
- **pnpm** 9+
- **PostgreSQL** 15+
- **Redis** 7+
- An **Anthropic API key** — [get one here](https://console.anthropic.com/)

### 1. Clone & install

```bash
git clone https://github.com/henrygambles/netbank.git
cd netbank
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
# Database
DATABASE_URL=postgresql://netbank:netbank@localhost:5432/netbank
REDIS_URL=redis://localhost:6379

# Auth — generate strong random strings for production
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# AI — get your key at console.anthropic.com
ANTHROPIC_API_KEY=sk-ant-...

# Crypto (optional for dev)
ENCRYPTION_KEY=your-32-char-minimum-secret-here
```

### 3. Start the database

```bash
docker-compose up -d postgres redis
```

### 4. Push the schema

```bash
pnpm --filter api-gateway prisma db push
```

### 5. Run everything

```bash
pnpm dev
```

This starts all services in parallel via Turborepo:

| Service | URL |
|---|---|
| Web app | http://localhost:3100 |
| API gateway | http://localhost:3000 |
| API docs (Swagger) | http://localhost:3000/api |

### 6. Mobile (optional)

```bash
# Install Expo Go on your simulator or physical device, then:
pnpm --filter mobile start
```

Scan the QR code with Expo Go. Done.

<br />

---

## 🔑 Environment variables

A full reference of every variable the app uses:

```env
# ─── Database ─────────────────────────────────────────────────
DATABASE_URL=             # PostgreSQL connection string
REDIS_URL=                # Redis connection string

# ─── Auth ─────────────────────────────────────────────────────
JWT_SECRET=               # Access token signing secret
JWT_REFRESH_SECRET=       # Refresh token signing secret
GOOGLE_CLIENT_ID=         # Google OAuth (optional)
GOOGLE_CLIENT_SECRET=     # Google OAuth (optional)
APPLE_CLIENT_ID=          # Apple Sign-In (optional)
APPLE_TEAM_ID=            # Apple Sign-In (optional)
APPLE_KEY_ID=             # Apple Sign-In (optional)
APPLE_PRIVATE_KEY=        # Apple Sign-In (optional)

# ─── AI ───────────────────────────────────────────────────────
ANTHROPIC_API_KEY=        # Required for Sabrina

# ─── Crypto ───────────────────────────────────────────────────
ENCRYPTION_KEY=           # Min 32 chars — encrypts wallet private keys
BTC_NETWORK=              # mainnet or testnet
ETH_RPC_URL=              # Ethereum RPC endpoint
SOL_RPC_URL=              # Solana RPC endpoint

# ─── Web ──────────────────────────────────────────────────────
NEXT_PUBLIC_API_URL=      # Points web app at the API
NEXT_PUBLIC_APP_NAME=     # Defaults to "Netbank"
```

Copy `.env.example` and you'll have the full list with empty values ready to fill.

<br />

---

## 📁 Key files

```
apps/web/src/
├── app/
│   ├── dashboard/page.tsx       # Main dashboard
│   ├── invest/page.tsx          # Love thy neighbour
│   ├── crypto/page.tsx          # Crypto portfolio & market
│   └── sabrina/page.tsx         # AI chat
└── components/
    ├── dashboard/CryptoTicker   # Live price marquee
    └── sabrina/SabrinaWidget    # Streaming chat widget

apps/mobile/src/
├── screens/
│   ├── HomeScreen.tsx           # Balance & quick actions
│   ├── InvestScreen.tsx         # Community investing
│   ├── SabrinaScreen.tsx        # AI chat (XHR SSE streaming)
│   ├── CryptoScreen.tsx         # Portfolio & market
│   └── TransactionsScreen.tsx   # Full history & search
└── lib/
    ├── stores/auth.ts            # Zustand auth (JWT + auto-refresh)
    ├── stores/theme.ts           # Zustand dark mode
    └── colors.ts                 # Light/dark colour palette

services/api-gateway/src/
├── auth/                        # JWT strategy, guards, OAuth
├── sabrina/                     # SSE streaming chat controller
└── crypto/                      # Wallet & price endpoints
```

<br />

---

## 🤝 Community investing — how it works

The **Invest** tab is one of Netbank's most distinctive features. Instead of abstract index funds, users back real people in their communities:

1. **Browse** — see verified profiles of people who need support
2. **Back** — invest any amount, directly to the person
3. **Earn** — receive interest as the person repays over time
4. **Nominate** — put forward someone you know who could use a hand

Every profile is real. Every story is verified. Every penny is traceable.

<br />

---

## 🔒 Security

- Passwords hashed with **bcrypt** (12 rounds)
- JWT access tokens expire in **15 minutes**, refresh tokens in 30 days
- Crypto private keys **AES-encrypted at rest**
- All API routes protected by `JwtAuthGuard`
- No secrets ever committed — `.env` is in `.gitignore`
- CORS configured per environment

<br />

---

## 🗺️ Roadmap

- [x] Open Banking — connect any bank via Plaid ✅
- [ ] Apple Pay & Google Pay
- [ ] Instant UK bank transfers (Faster Payments)
- [ ] Scheduled payments & standing orders
- [ ] Sabrina proactive nudges (*"You're about to go over budget on dining"*)
- [ ] Community investing — live repayment tracking
- [ ] Web3 — on-chain community funding pools
- [ ] Spend abroad with real exchange rates

The best part? This is still early. Every checkbox above is a step toward banking that's faster, kinder, and more human than what came before — and we're just getting started. 🌍💛

<br />

---

## 📄 License

MIT © Netbank

<br />

---

<div align="center">

Made with ✦ and a lot of late nights — and a genuine belief that money can move with more heart.

*Banking built for humans. Not spreadsheets.*

**The future is open. Let's build it together.** 🚀🏦✨

</div>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=henrygambles/Netbank&type=Date)](https://star-history.com/#henrygambles/Netbank&Date)
