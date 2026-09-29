import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 18. Cabeceras de seguridad
  app.use(helmet());

  // 14. Valida entradas & 8. Bloquea manipulación de campos
  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true, // Remueve campos no definidos en los DTOs
    forbidNonWhitelisted: true, // Lanza error si envían campos extra
    transform: true // Transforma automáticamente payloads a los tipos DTO
  }));

  app.enableCors(); // Permite solicitudes del Frontend (Electron/React)
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
await bootstrap();
