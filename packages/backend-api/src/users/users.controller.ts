import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, ForbiddenException, Delete } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { User } from './entities/user.entity.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Role } from './enums/role.enum.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: Partial<User>) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-users')
  async getMyUsers(@Request() req: any) {
    if (req.user.role !== Role.PROPIETARIO && req.user.role !== Role.ADMINISTRADOR) {
      throw new ForbiddenException('Solo los propietarios pueden ver sus usuarios.');
    }
    const all = await this.usersService.findAll();
    return all.filter(u => u.companyId === req.user.companyId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('my-users')
  async createCompanyUser(@Request() req: any, @Body() body: any) {
    if (req.user.role !== Role.PROPIETARIO && req.user.role !== Role.ADMINISTRADOR) {
      throw new ForbiddenException('Solo los propietarios pueden crear usuarios.');
    }
    return this.usersService.create({
      username: body.username,
      passwordHash: body.password,
      fullName: body.fullName,
      role: body.role || Role.CAJERO,
      companyId: req.user.companyId,
      isActive: true,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Delete('my-users/:id')
  async deleteCompanyUser(@Request() req: any, @Param('id') id: string) {
    if (req.user.role !== Role.PROPIETARIO && req.user.role !== Role.ADMINISTRADOR) {
      throw new ForbiddenException('Solo los propietarios pueden eliminar usuarios.');
    }
    return this.usersService.deleteUser(id, req.user.companyId);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id/subscription')
  updateSubscription(
    @Param('id') id: string,
    @Body() body: { isSubscribed: boolean; subscriptionPlan: string | null; nextBillingDate: Date | null }
  ) {
    return this.usersService.updateSubscription(id, body.isSubscribed, body.subscriptionPlan, body.nextBillingDate);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: Partial<User>) {
    return this.usersService.update(id, updateUserDto);
  }
}
