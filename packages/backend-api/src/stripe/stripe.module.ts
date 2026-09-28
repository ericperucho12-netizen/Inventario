import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller.js';
import { StripeService } from './stripe.service.js';

@Module({
  controllers: [StripeController],
  providers: [StripeService],
})
export class StripeModule {}
