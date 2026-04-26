import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.API_PORT
    ? parseInt(process.env.API_PORT, 10)
    : 4100;
  await app.listen(port);
  console.log(`SupportPlane API listening on http://localhost:${port}`);
}
bootstrap();
