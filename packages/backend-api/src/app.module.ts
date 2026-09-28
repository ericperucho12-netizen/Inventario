import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { ProductsModule } from './products/products.module.js';
import { SalesModule } from './sales/sales.module.js';
import { CashShiftsModule } from './cash-shifts/cash-shifts.module.js';
import { SuppliersModule } from './suppliers/suppliers.module.js';
import { PurchasesModule } from './purchases/purchases.module.js';
import { CustomersModule } from './customers/customers.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { ExpensesModule } from './expenses/expenses.module.js';
import { StripeModule } from './stripe/stripe.module.js';
import { CompaniesModule } from './companies/companies.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'Pelusa01',
      database: process.env.DB_NAME || 'peruchos',
      autoLoadEntities: true,
      synchronize: true, // Crea/actualiza tablas automáticamente
      ssl: process.env.DB_HOST?.includes('rds.amazonaws.com') ? { rejectUnauthorized: false } : false,
    }),
    UsersModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    SalesModule,
    CashShiftsModule,
    SuppliersModule,
    PurchasesModule,
    CustomersModule,
    DashboardModule,
    ReportsModule,
    ExpensesModule,
    StripeModule,
    CompaniesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
