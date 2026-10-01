import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'peruchos_super_secret_key_2026',
    });
  }

  async validate(payload: any) {
    // Si el JWT es muy antiguo y no tiene companyId, obligamos a reloguear para evitar leak de datos
    if (payload.companyId === undefined && payload.username !== 'admin') {
      throw new UnauthorizedException('Tu sesión ha expirado o es antigua. Por favor, cierra sesión y vuelve a entrar.');
    }
    
    return { 
      userId: payload.sub, 
      username: payload.username, 
      role: payload.role, 
      companyId: payload.companyId || null 
    };
  }
}
