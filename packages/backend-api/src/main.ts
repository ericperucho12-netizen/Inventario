import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 18. Cabeceras de seguridad
  app.use(helmet());

  // 14. Valida entradas
  app.useGlobalPipes(new ValidationPipe({ 
    transform: true // Transforma automáticamente payloads a los tipos DTO
  }));

  app.enableCors(); // Permite solicitudes del Frontend (Electron/React)
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
await bootstrap();
