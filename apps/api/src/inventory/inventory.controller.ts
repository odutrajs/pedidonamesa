import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@pedidonamesa/shared';
import { JwtAuthGuard, assertRole } from '../auth/jwt-auth.guard';
import { User } from '../entities/user.entity';
import { InventoryService } from './inventory.service';
import {
  CreateIngredientDto,
  CmvReportQueryDto,
  StockMovementDto,
  SubmitInventoryCountDto,
  UpdateIngredientDto,
  UpdateProductRecipeDto,
} from './dto/inventory.dto';

@Controller('admin/inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('ingredients')
  listIngredients(@Req() req: { user: User }) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.inventoryService.listIngredients(req.user.restaurantId);
  }

  @Post('ingredients')
  createIngredient(@Req() req: { user: User }, @Body() dto: CreateIngredientDto) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.inventoryService.createIngredient(req.user.restaurantId, dto);
  }

  @Patch('ingredients/:id')
  updateIngredient(
    @Param('id') id: string,
    @Req() req: { user: User },
    @Body() dto: UpdateIngredientDto,
  ) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.inventoryService.updateIngredient(id, req.user.restaurantId, dto);
  }

  @Delete('ingredients/:id')
  deleteIngredient(@Param('id') id: string, @Req() req: { user: User }) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.inventoryService.deleteIngredient(id, req.user.restaurantId);
  }

  @Get('movements')
  listMovements(@Req() req: { user: User }) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.inventoryService.listMovements(req.user.restaurantId);
  }

  @Post('movements/purchase')
  recordPurchase(@Req() req: { user: User }, @Body() dto: StockMovementDto) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.inventoryService.recordPurchase(req.user.restaurantId, dto);
  }

  @Post('movements/adjustment')
  recordAdjustment(@Req() req: { user: User }, @Body() dto: StockMovementDto) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.inventoryService.recordAdjustment(req.user.restaurantId, dto);
  }

  @Get('alerts')
  getAlerts(@Req() req: { user: User }) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.inventoryService.getLowStockAlerts(req.user.restaurantId);
  }

  @Get('products/:productId/recipe')
  getRecipe(@Param('productId') productId: string, @Req() req: { user: User }) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.inventoryService.getProductRecipe(productId, req.user.restaurantId);
  }

  @Put('products/:productId/recipe')
  updateRecipe(
    @Param('productId') productId: string,
    @Req() req: { user: User },
    @Body() dto: UpdateProductRecipeDto,
  ) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.inventoryService.updateProductRecipe(productId, req.user.restaurantId, dto);
  }

  @Post('counts')
  submitCount(@Req() req: { user: User }, @Body() dto: SubmitInventoryCountDto) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.inventoryService.submitInventoryCount(req.user.restaurantId, dto);
  }

  @Get('counts')
  listCounts(@Req() req: { user: User }) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.inventoryService.listInventoryCounts(req.user.restaurantId);
  }

  @Get('cmv')
  getCmv(@Req() req: { user: User }, @Query() query: CmvReportQueryDto) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.inventoryService.getCmvReport(req.user.restaurantId, query.from, query.to);
  }
}
