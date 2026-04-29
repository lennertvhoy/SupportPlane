import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Dev-only CORS: allow the SupportPlane web cockpit on common local ports.
  // This must be replaced by a strict origin allowlist before any production use.
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3100',
      'http://localhost:3200',
      'http://localhost:3300',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3100',
      'http://127.0.0.1:3200',
    ],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'x-user-id', 'x-user-role'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  const port = process.env.API_PORT
    ? parseInt(process.env.API_PORT, 10)
    : 4100;
  await app.listen(port);
  console.log(`SupportPlane API listening on http://localhost:${port}`);
}
bootstrap();
