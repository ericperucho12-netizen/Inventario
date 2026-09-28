import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../companies/entities/company.entity.js';
import { Role } from '../users/enums/role.enum.js';
import { User } from '../users/entities/user.entity.js';
import { Category } from '../categories/entities/category.entity.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(Company) private companyRepository: Repository<Company>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Category) private categoryRepository: Repository<Category>,
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

    // Crear categorías por defecto para la nueva empresa
    const defaultCategories = ["Aceites y Mantecas","Arroz, Frijoles y Semillas","Azúcar y Sal","Café, Té y Sustitutos de Crema","Cereales y Avenas","Enlatados y Conservas","Especias y Condimentos","Harinas y Repostería","Mayonesas, Aderezos y Salsas","Pastas y Sopas","Agua Natural y Mineral","Bebidas Energizantes e Hidratantes","Jugos y Néctares","Refrescos / Gaseosas","Cervezas","Vinos y Licores","Botanas Saladas","Chocolates","Dulces, Chicles y Caramelos","Galletas","Gelatinas y Flanes","Leche","Quesos","Yogurt y Bebidas Lácteas","Mantequilla y Margarina","Carnes Frías y Embutidos","Pan Dulce Empacado","Pan de Caja","Tortillas y Tostadas","Cloro y Desinfectantes","Detergentes y Suavizantes","Insecticidas y Repelentes","Lavastrastes","Limpiadores de Pisos y Vidrios","Papel Higiénico y Servilletas","Utensilios de Limpieza","Cuidado Bucal","Cuidado del Cabello","Desodorantes y Talcos","Jabón de Tocador","Protección Femenina","Rastrillos y Cremas de Afeitar","Cuidado del Bebé","Analgésicos y Antigripales","Antiácidos y Digestivos","Primeros Auxilios","Frutas Frescas","Verduras y Legumbres","Huevo","Helados y Paletas","Hielo","Alimento para Perros","Alimento para Gatos","Accesorios para Mascotas","Cigarros","Encendedores y Cerillos","Vasos, Platos y Cubiertos Desechables","Carbón","Bolsas de Plástico/Papel","Artículos para Fiestas","Recargas Telefónicas","Pago de Servicios","Electrónica Básica y Ferretería"];
    for (const catName of defaultCategories) {
      await this.categoryRepository.save({
        name: catName,
        companyId: company.id,
      });
    }

    return this.login(user);
  }
}
