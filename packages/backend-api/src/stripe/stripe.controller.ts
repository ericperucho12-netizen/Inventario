import { Controller, Post } from '@nestjs/common';
import { StripeService } from './stripe.service.js';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('create-setup-intent')
  createSetupIntent() {
    return this.stripeService.createSetupIntent();
  }
}
