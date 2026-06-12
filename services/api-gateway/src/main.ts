import { NestFactory } from '@nestjs/core'
import { ValidationPipe, VersioningType } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import helmet from 'helmet'
import compression from 'compression'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const config = app.get(ConfigService)
  const port = config.get<number>('API_GATEWAY_PORT', 3000)

  app.use(helmet())
  app.use(compression())

  app.enableCors({
    origin: [
      'http://localhost:3100',
      'https://app.netbank.com',
    ],
    credentials: true,
  })

  app.enableVersioning({ type: VersioningType.URI })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Netbank API')
    .setDescription('The Netbank banking platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('docs', app, document)

  await app.listen(port)
  console.log(`🏦 Netbank API running on port ${port}`)
  console.log(`📚 Swagger docs at http://localhost:${port}/docs`)
}

bootstrap()
