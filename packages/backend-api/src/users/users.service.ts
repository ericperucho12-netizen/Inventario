import { Injectable, ConflictException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';
import * as bcrypt from 'bcrypt';
import { Role } from './enums/role.enum.js';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    // Seed admin user automatically if no users exist
    const count = await this.userRepository.count();
    if (count === 0) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('admin123', salt);
      
      const admin = this.userRepository.create({
        username: 'admin',
        passwordHash: hash,
        fullName: 'Administrador Principal',
        role: Role.ADMINISTRADOR,
        isActive: true,
      });
      await this.userRepository.save(admin);
      console.log('--- ADMIN DEFAULT USER CREATED ---');
    }
  }

  async create(userData: Partial<User>): Promise<Partial<User>> {
    const existingUser = await this.userRepository.findOne({ where: { username: userData.username } });
    if (existingUser) {
      throw new ConflictException('El nombre de usuario ya está en uso.');
    }

    // Hashear la contraseña obligatoriamente por seguridad
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(userData.passwordHash as string, salt);
    
    const user = this.userRepository.create({
      ...userData,
      passwordHash: hash,
    });

    const savedUser = await this.userRepository.save(user);
    const { passwordHash, ...result } = savedUser;
    return result;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'username', 'fullName', 'role', 'isActive', 'isSubscribed', 'subscriptionPlan', 'nextBillingDate', 'createdAt'] // No devolvemos passwordHash
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    // Este método sí devuelve el passwordHash porque lo necesita AuthModule para verificar
    return this.userRepository.findOne({ where: { username } });
  }

  async updateSubscription(id: string, isSubscribed: boolean, subscriptionPlan: string | null, nextBillingDate: Date | null): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    
    user.isSubscribed = isSubscribed;
    user.subscriptionPlan = subscriptionPlan as any;
    user.nextBillingDate = nextBillingDate as any;
    
    return this.userRepository.save(user);
  }

  async update(id: string, updateData: Partial<User>): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (updateData.passwordHash) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(updateData.passwordHash as string, salt);
    }

    Object.assign(user, updateData);
    const savedUser = await this.userRepository.save(user);
    const { passwordHash, ...result } = savedUser;
    return result;
  }
}
