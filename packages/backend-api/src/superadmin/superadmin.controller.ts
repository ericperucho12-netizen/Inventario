import { Controller, Get, UseGuards, Request, ForbiddenException, Patch, Param, Body, Delete } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../companies/entities/company.entity.js';
import { User } from '../users/entities/user.entity.js';

@UseGuards(JwtAuthGuard)
@Controller('superadmin')
export class SuperadminController {
  constructor(
    @InjectRepository(Company) private companyRepository: Repository<Company>,
    @InjectRepository(User) private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  // Middleware manual para asegurar que es SuperAdmin
  private ensureSuperAdmin(req: any) {
    if (req.user.companyId !== null) {
      throw new ForbiddenException('No tienes permisos de super administrador');
    }
  }

  @Get('dashboard')
  async getDashboard(@Request() req: any) {
    this.ensureSuperAdmin(req);
    const totalCompanies = await this.companyRepository.count();
    const totalUsers = await this.userRepository.count();
    return {
      totalCompanies,
      totalUsers,
    };
  }

  @Get('companies')
  async getCompanies(@Request() req: any) {
    this.ensureSuperAdmin(req);
    const companies = await this.companyRepository.find({
      order: { createdAt: 'DESC' },
    });
    
    // Adjuntar la información del propietario y su suscripción
    const result = [];
    for (const company of companies) {
      const owner = await this.userRepository.findOne({ 
        where: { companyId: company.id, role: 'PROPIETARIO' as any },
        select: ['id', 'username', 'fullName', 'isSubscribed', 'subscriptionPlan', 'nextBillingDate']
      });
      result.push({
        ...company,
        owner: owner || null
      });
    }
    return result;
  }

  @Patch('companies/:id/status')
  async toggleCompanyStatus(@Request() req: any, @Param('id') id: string, @Body('isActive') isActive: boolean) {
    this.ensureSuperAdmin(req);
    await this.companyRepository.update(id, { isActive });
    return { success: true };
  }

  @Patch('companies/:id/approve-subscription')
  async approveSubscription(@Request() req: any, @Param('id') id: string, @Body('months') months: number = 1) {
    this.ensureSuperAdmin(req);
    
    // Buscar al dueño de la empresa (PROPIETARIO)
    const owner = await this.userRepository.findOne({ where: { companyId: id, role: 'PROPIETARIO' as any } });
    if (!owner) throw new ForbiddenException('No se encontró al propietario de la empresa');

    // Calcular nueva fecha: X meses a partir de hoy (o sumarle X meses si ya tenía saldo a favor)
    let newBillingDate = new Date();
    if (owner.nextBillingDate) {
      const currentNext = new Date(owner.nextBillingDate);
      if (currentNext.getTime() > new Date().getTime()) {
        newBillingDate = currentNext;
      }
    }
    newBillingDate.setMonth(newBillingDate.getMonth() + months);

    await this.userRepository.update(owner.id, {
      isSubscribed: true,
      subscriptionPlan: months === 12 ? ('yearly' as any) : ('monthly' as any),
      nextBillingDate: newBillingDate,
    });

    return { success: true, newBillingDate };
  }

  @Patch('companies/:id/revoke-subscription')
  async revokeSubscription(@Request() req: any, @Param('id') id: string) {
    this.ensureSuperAdmin(req);
    
    // Buscar al dueño de la empresa (PROPIETARIO)
    const owner = await this.userRepository.findOne({ where: { companyId: id, role: 'PROPIETARIO' as any } });
    if (!owner) throw new ForbiddenException('No se encontró al propietario de la empresa');

    await this.userRepository.update(owner.id, {
      isSubscribed: false,
      subscriptionPlan: null as any,
      nextBillingDate: null as any,
    });

    return { success: true };
  }

  @Delete('companies/:id')
  async deleteCompany(@Request() req: any, @Param('id') id: string) {
    this.ensureSuperAdmin(req);

    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company) throw new ForbiddenException('Empresa no encontrada');

    // Borrar todos los datos transaccionales y luego la empresa con sus usuarios
    await this.dataSource.query(`DELETE FROM sale_details WHERE "saleId" IN (SELECT id FROM sales WHERE "companyId" = $1)`, [id]);
    await this.dataSource.query(`DELETE FROM sales WHERE "companyId" = $1`, [id]);
    await this.dataSource.query(`DELETE FROM purchase_details WHERE "purchaseId" IN (SELECT id FROM purchases WHERE "companyId" = $1)`, [id]);
    await this.dataSource.query(`DELETE FROM purchases WHERE "companyId" = $1`, [id]);
    await this.dataSource.query(`DELETE FROM expenses WHERE "companyId" = $1`, [id]);
    await this.dataSource.query(`DELETE FROM cash_shifts WHERE "companyId" = $1`, [id]);
    await this.dataSource.query(`DELETE FROM customers WHERE "companyId" = $1`, [id]);
    await this.dataSource.query(`DELETE FROM suppliers WHERE "companyId" = $1`, [id]);
    await this.dataSource.query(`DELETE FROM products WHERE "companyId" = $1`, [id]);
    await this.dataSource.query(`DELETE FROM categories WHERE "companyId" = $1`, [id]);
    await this.dataSource.query(`DELETE FROM users WHERE "companyId" = $1`, [id]);
    await this.companyRepository.delete(id);

    return { success: true, message: `Empresa y todos sus datos eliminados.` };
  }
}
