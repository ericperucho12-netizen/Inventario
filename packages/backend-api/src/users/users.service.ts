import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

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
      select: ['id', 'username', 'fullName', 'role', 'isActive', 'createdAt'] // No devolvemos passwordHash
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    // Este método sí devuelve el passwordHash porque lo necesita AuthModule para verificar
    return this.userRepository.findOne({ where: { username } });
  }
}
