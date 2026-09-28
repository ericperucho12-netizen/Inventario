import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuperadminController } from './superadmin.controller.js';
import { Company } from '../companies/entities/company.entity.js';
import { User } from '../users/entities/user.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Company, User])],
  controllers: [SuperadminController],
})
export class SuperadminModule {}
