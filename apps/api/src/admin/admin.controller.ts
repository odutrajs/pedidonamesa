import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@pedidonamesa/shared';
import { JwtAuthGuard, assertRole } from '../auth/jwt-auth.guard';
import { User } from '../entities/user.entity';
import { AdminService } from './admin.service';
import {
  CreateCategoryDto,
  CreateProductDto,
  CreateTableDto,
  UpdateCategoryDto,
  UpdateProductDto,
  UpdateTableDto,
} from './dto/admin.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('categories')
  getCategories(@Req() req: { user: User }) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.adminService.getCategories(req.user.restaurantId);
  }

  @Post('categories')
  createCategory(@Req() req: { user: User }, @Body() dto: CreateCategoryDto) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.adminService.createCategory(req.user.restaurantId, dto);
  }

  @Patch('categories/:id')
  updateCategory(
    @Param('id') id: string,
    @Req() req: { user: User },
    @Body() dto: UpdateCategoryDto,
  ) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.adminService.updateCategory(id, req.user.restaurantId, dto);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string, @Req() req: { user: User }) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.adminService.deleteCategory(id, req.user.restaurantId);
  }

  @Get('products')
  getProducts(@Req() req: { user: User }) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.adminService.getProducts(req.user.restaurantId);
  }

  @Post('products')
  createProduct(@Req() req: { user: User }, @Body() dto: CreateProductDto) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.adminService.createProduct(req.user.restaurantId, dto);
  }

  @Patch('products/:id')
  updateProduct(
    @Param('id') id: string,
    @Req() req: { user: User },
    @Body() dto: UpdateProductDto,
  ) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.adminService.updateProduct(id, req.user.restaurantId, dto);
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string, @Req() req: { user: User }) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.adminService.deleteProduct(id, req.user.restaurantId);
  }

  @Get('tables')
  getTables(@Req() req: { user: User }) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.adminService.getTables(req.user.restaurantId);
  }

  @Post('tables')
  createTable(@Req() req: { user: User }, @Body() dto: CreateTableDto) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.adminService.createTable(req.user.restaurantId, dto);
  }

  @Patch('tables/:id')
  updateTable(
    @Param('id') id: string,
    @Req() req: { user: User },
    @Body() dto: UpdateTableDto,
  ) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.adminService.updateTable(id, req.user.restaurantId, dto);
  }

  @Post('tables/:id/regenerate-token')
  regenerateToken(@Param('id') id: string, @Req() req: { user: User }) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.adminService.regenerateTableToken(id, req.user.restaurantId);
  }
}
