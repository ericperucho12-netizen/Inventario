import { Controller, Post } from '@nestjs/common';
import { StripeService } from './stripe.service.js';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('create-setup-intent')
  async createSetupIntent() {
    try {
      return await this.stripeService.createSetupIntent();
    } catch (e: any) {
      console.error('Stripe error:', e);
      return { error: e.message, stack: e.stack };
    }
  }
}
