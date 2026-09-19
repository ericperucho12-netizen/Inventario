import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Permite solicitudes del Frontend (Electron/React)
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
