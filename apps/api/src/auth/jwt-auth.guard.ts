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
