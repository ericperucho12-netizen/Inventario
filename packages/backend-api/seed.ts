import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module.js';
import { UsersService } from './src/users/users.service.js';
import { Role } from './src/users/enums/role.enum.js';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const existing = await usersService.findByUsername('admin');
  if (!existing) {
    await usersService.create({
      username: 'admin',
      passwordHash: 'admin123',
      fullName: 'Administrador Principal',
      role: Role.ADMIN,
    });
    console.log('User admin created with password admin123');
  } else {
    console.log('Admin user already exists');
  }

  await app.close();
}
bootstrap();
