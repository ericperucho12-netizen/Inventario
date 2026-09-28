import { Controller, Get, UseGuards, Request, ForbiddenException, Patch, Param, Body } from '@nestjs/common';
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
    return this.companyRepository.find({
      order: { createdAt: 'DESC' },
    });
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
      subscriptionPlan: 'monthly' as any,
      nextBillingDate: newBillingDate,
    });

    return { success: true, newBillingDate };
  }
}
