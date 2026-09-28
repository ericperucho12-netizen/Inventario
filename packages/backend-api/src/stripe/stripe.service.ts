import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2025-02-24.acacia' as any, // Cast to any to bypass version mismatch in local types
    });
  }

  async createSetupIntent() {
    // Para simplificar, creamos un Customer nuevo cada vez.
    // En producción, buscaríamos si el usuario ya tiene customerId en la BD.
    const customer = await this.stripe.customers.create({
      description: 'Cliente de PeruchOS (Suscripción)',
    });

    const setupIntent = await this.stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
      usage: 'off_session', // Permitir cargos futuros automáticos
    });

    return {
      clientSecret: setupIntent.client_secret,
    };
  }
}
