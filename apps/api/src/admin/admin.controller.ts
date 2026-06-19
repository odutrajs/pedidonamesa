import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@pedidonamesa/shared';
import { JwtAuthGuard, assertRole } from '../auth/jwt-auth.guard';
import { User } from '../entities/user.entity';
import { AdminService } from './admin.service';
import { OrdersService } from '../orders/orders.service';
import {
  CreateCategoryDto,
  CreateProductDto,
  CreateTableDto,
  UpdateCategoryDto,
  UpdateProductDto,
  UpdateProductSuggestionsDto,
  UpdateRestaurantSettingsDto,
  UpdateTableDto,
  ReorderCategoriesDto,
} from './dto/admin.dto';

const imageUploadOptions = {
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      cb(new BadRequestException('Formato de imagem não suportado'), false);
      return;
    }
    cb(null, true);
  },
};

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly ordersService: OrdersService,
  ) {}

  @Get('orders')
  getOrders(@Req() req: { user: User }) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.ordersService.getRestaurantOrders(req.user.restaurantId);
  }

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

  @Patch('categories/reorder')
  reorderCategories(@Req() req: { user: User }, @Body() dto: ReorderCategoriesDto) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.adminService.reorderCategories(req.user.restaurantId, dto.orderedIds);
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
  @UseInterceptors(FileInterceptor('file', imageUploadOptions))
  createProduct(
    @Req() req: { user: User },
    @Body() dto: CreateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.adminService.createProduct(req.user.restaurantId, dto, file);
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

  @Post('products/:id/image')
  @UseInterceptors(FileInterceptor('file', imageUploadOptions))
  uploadProductImage(
    @Param('id') id: string,
    @Req() req: { user: User },
    @UploadedFile() file: Express.Multer.File,
  ) {
    assertRole(req.user, [UserRole.ADMIN]);
    if (!file) throw new BadRequestException('Arquivo de imagem obrigatório');
    return this.adminService.uploadProductImage(id, req.user.restaurantId, file);
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string, @Req() req: { user: User }) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.adminService.deleteProduct(id, req.user.restaurantId);
  }

  @Put('products/:id/suggestions')
  updateProductSuggestions(
    @Param('id') id: string,
    @Req() req: { user: User },
    @Body() dto: UpdateProductSuggestionsDto,
  ) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.adminService.updateProductSuggestions(id, req.user.restaurantId, dto);
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

  @Get('settings')
  getSettings(@Req() req: { user: User }) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.adminService.getRestaurantSettings(req.user.restaurantId);
  }

  @Patch('settings')
  updateSettings(@Req() req: { user: User }, @Body() dto: UpdateRestaurantSettingsDto) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.adminService.updateRestaurantSettings(req.user.restaurantId, dto);
  }
}
