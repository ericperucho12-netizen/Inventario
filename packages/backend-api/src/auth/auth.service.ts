import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../companies/entities/company.entity.js';
import { Role } from '../users/enums/role.enum.js';
import { User } from '../users/entities/user.entity.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(Company) private companyRepository: Repository<Company>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);
    if (user && await bcrypt.compare(pass, user.passwordHash)) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id, role: user.role, companyId: user.companyId };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        companyId: user.companyId,
        isSubscribed: user.isSubscribed,
        subscriptionPlan: user.subscriptionPlan,
        nextBillingDate: user.nextBillingDate
      }
    };
  }

  async register(data: any) {
    const existing = await this.userRepository.findOne({ where: { username: data.username } });
    if (existing) throw new Error('El usuario ya existe');

    const company = await this.companyRepository.save({
      name: data.companyName,
    });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(data.password, salt);

    const user = await this.userRepository.save({
      username: data.username,
      passwordHash: hash,
      fullName: data.fullName,
      role: Role.PROPIETARIO,
      companyId: company.id,
    });

    return this.login(user);
  }
}
