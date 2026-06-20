import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, assertSuperAdmin } from '../auth/jwt-auth.guard';
import { User } from '../entities/user.entity';
import {
  CreateRestaurantDto,
  CreateRestaurantUserDto,
  UpdateRestaurantDto,
} from './dto/super-admin.dto';
import { SuperAdminService } from './super-admin.service';

@Controller('super-admin')
@UseGuards(JwtAuthGuard)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('restaurants')
  listRestaurants(@Req() req: { user: User }) {
    assertSuperAdmin(req.user);
    return this.superAdminService.listRestaurants();
  }

  @Post('restaurants')
  createRestaurant(@Req() req: { user: User }, @Body() dto: CreateRestaurantDto) {
    assertSuperAdmin(req.user);
    return this.superAdminService.createRestaurant(dto);
  }

  @Get('restaurants/:id')
  getRestaurant(@Req() req: { user: User }, @Param('id') id: string) {
    assertSuperAdmin(req.user);
    return this.superAdminService.getRestaurant(id);
  }

  @Patch('restaurants/:id')
  updateRestaurant(
    @Req() req: { user: User },
    @Param('id') id: string,
    @Body() dto: UpdateRestaurantDto,
  ) {
    assertSuperAdmin(req.user);
    return this.superAdminService.updateRestaurant(id, dto);
  }

  @Get('restaurants/:id/users')
  listRestaurantUsers(@Req() req: { user: User }, @Param('id') id: string) {
    assertSuperAdmin(req.user);
    return this.superAdminService.listRestaurantUsers(id);
  }

  @Post('restaurants/:id/users')
  createRestaurantUser(
    @Req() req: { user: User },
    @Param('id') id: string,
    @Body() dto: CreateRestaurantUserDto,
  ) {
    assertSuperAdmin(req.user);
    return this.superAdminService.createRestaurantUser(id, dto);
  }
}
