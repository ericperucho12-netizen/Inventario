import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { User } from './entities/user.entity.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: Partial<User>) {
    return this.usersService.create(createUserDto);
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
