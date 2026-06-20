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
import { JwtAuthGuard, assertRole, requireRestaurantId } from '../auth/jwt-auth.guard';
import { User } from '../entities/user.entity';
import { RestaurantFeaturesService } from '../restaurant-features/restaurant-features.service';
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
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly featuresService: RestaurantFeaturesService,
  ) {}

  private async guardInventoryAdmin(req: { user: User }) {
    assertRole(req.user, [UserRole.ADMIN]);
    await this.featuresService.assertInventoryEnabled(requireRestaurantId(req.user));
  }

  @Get('ingredients')
  async listIngredients(@Req() req: { user: User }) {
    await this.guardInventoryAdmin(req);
    return this.inventoryService.listIngredients(requireRestaurantId(req.user));
  }

  @Post('ingredients')
  async createIngredient(@Req() req: { user: User }, @Body() dto: CreateIngredientDto) {
    await this.guardInventoryAdmin(req);
    return this.inventoryService.createIngredient(requireRestaurantId(req.user), dto);
  }

  @Patch('ingredients/:id')
  async updateIngredient(
    @Param('id') id: string,
    @Req() req: { user: User },
    @Body() dto: UpdateIngredientDto,
  ) {
    await this.guardInventoryAdmin(req);
    return this.inventoryService.updateIngredient(id, requireRestaurantId(req.user), dto);
  }

  @Delete('ingredients/:id')
  async deleteIngredient(@Param('id') id: string, @Req() req: { user: User }) {
    await this.guardInventoryAdmin(req);
    return this.inventoryService.deleteIngredient(id, requireRestaurantId(req.user));
  }

  @Get('movements')
  async listMovements(@Req() req: { user: User }) {
    await this.guardInventoryAdmin(req);
    return this.inventoryService.listMovements(requireRestaurantId(req.user));
  }

  @Post('movements/purchase')
  async recordPurchase(@Req() req: { user: User }, @Body() dto: StockMovementDto) {
    await this.guardInventoryAdmin(req);
    return this.inventoryService.recordPurchase(requireRestaurantId(req.user), dto);
  }

  @Post('movements/adjustment')
  async recordAdjustment(@Req() req: { user: User }, @Body() dto: StockMovementDto) {
    await this.guardInventoryAdmin(req);
    return this.inventoryService.recordAdjustment(requireRestaurantId(req.user), dto);
  }

  @Get('alerts')
  async getAlerts(@Req() req: { user: User }) {
    await this.guardInventoryAdmin(req);
    return this.inventoryService.getLowStockAlerts(requireRestaurantId(req.user));
  }

  @Get('products/:productId/recipe')
  async getRecipe(@Param('productId') productId: string, @Req() req: { user: User }) {
    await this.guardInventoryAdmin(req);
    return this.inventoryService.getProductRecipe(productId, requireRestaurantId(req.user));
  }

  @Put('products/:productId/recipe')
  async updateRecipe(
    @Param('productId') productId: string,
    @Req() req: { user: User },
    @Body() dto: UpdateProductRecipeDto,
  ) {
    await this.guardInventoryAdmin(req);
    return this.inventoryService.updateProductRecipe(productId, requireRestaurantId(req.user), dto);
  }

  @Post('counts')
  async submitCount(@Req() req: { user: User }, @Body() dto: SubmitInventoryCountDto) {
    await this.guardInventoryAdmin(req);
    return this.inventoryService.submitInventoryCount(requireRestaurantId(req.user), dto);
  }

  @Get('counts')
  async listCounts(@Req() req: { user: User }) {
    await this.guardInventoryAdmin(req);
    return this.inventoryService.listInventoryCounts(requireRestaurantId(req.user));
  }

  @Get('cmv')
  async getCmv(@Req() req: { user: User }, @Query() query: CmvReportQueryDto) {
    await this.guardInventoryAdmin(req);
    return this.inventoryService.getCmvReport(requireRestaurantId(req.user), query.from, query.to);
  }
}
