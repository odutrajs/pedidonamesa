import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@pedidonamesa/shared';
import { JwtAuthGuard, assertRole, requireRestaurantId } from '../auth/jwt-auth.guard';
import { User } from '../entities/user.entity';
import { RestaurantFeaturesService } from '../restaurant-features/restaurant-features.service';
import { FinanceService } from './finance.service';
import {
  CashClosingQueryDto,
  CreateExpenseDto,
  FinancePeriodQueryDto,
  UpdateExpenseDto,
} from './dto/finance.dto';

@Controller('admin/finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly featuresService: RestaurantFeaturesService,
  ) {}

  private async guardFinanceAdmin(req: { user: User }) {
    assertRole(req.user, [UserRole.ADMIN]);
    await this.featuresService.assertFinanceEnabled(requireRestaurantId(req.user));
  }

  @Get('dashboard')
  async getDashboard(@Req() req: { user: User }, @Query() query: FinancePeriodQueryDto) {
    await this.guardFinanceAdmin(req);
    return this.financeService.getDashboard(requireRestaurantId(req.user), query.from, query.to);
  }

  @Get('dre')
  async getDre(@Req() req: { user: User }, @Query() query: FinancePeriodQueryDto) {
    await this.guardFinanceAdmin(req);
    return this.financeService.getDreReport(requireRestaurantId(req.user), query.from, query.to);
  }

  @Get('cash-closing')
  async getCashClosing(@Req() req: { user: User }, @Query() query: CashClosingQueryDto) {
    await this.guardFinanceAdmin(req);
    return this.financeService.getCashClosing(requireRestaurantId(req.user), query.date);
  }

  @Get('expenses')
  async listExpenses(@Req() req: { user: User }, @Query() query: FinancePeriodQueryDto) {
    await this.guardFinanceAdmin(req);
    return this.financeService.listExpenses(requireRestaurantId(req.user), query.from, query.to);
  }

  @Post('expenses')
  async createExpense(@Req() req: { user: User }, @Body() dto: CreateExpenseDto) {
    await this.guardFinanceAdmin(req);
    return this.financeService.createExpense(requireRestaurantId(req.user), dto);
  }

  @Patch('expenses/:id')
  async updateExpense(
    @Param('id') id: string,
    @Req() req: { user: User },
    @Body() dto: UpdateExpenseDto,
  ) {
    await this.guardFinanceAdmin(req);
    return this.financeService.updateExpense(id, requireRestaurantId(req.user), dto);
  }

  @Delete('expenses/:id')
  async deleteExpense(@Param('id') id: string, @Req() req: { user: User }) {
    await this.guardFinanceAdmin(req);
    return this.financeService.deleteExpense(id, requireRestaurantId(req.user));
  }
}
