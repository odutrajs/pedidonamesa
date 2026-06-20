import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@pedidonamesa/shared';
import { User } from '../entities/user.entity';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

export function assertRole(user: User, roles: UserRole[]) {
  if (!roles.includes(user.role)) {
    throw new UnauthorizedException('Permissão insuficiente');
  }
}

export function assertSuperAdmin(user: User) {
  assertRole(user, [UserRole.SUPER_ADMIN]);
}

export function requireRestaurantId(user: User): string {
  if (!user.restaurantId) {
    throw new UnauthorizedException('Usuário sem restaurante associado');
  }
  return user.restaurantId;
}
