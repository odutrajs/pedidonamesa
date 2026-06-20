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
import { JwtAuthGuard, assertRole } from '../auth/jwt-auth.guard';
import { User } from '../entities/user.entity';
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
  constructor(private readonly financeService: FinanceService) {}

  @Get('dashboard')
  getDashboard(@Req() req: { user: User }, @Query() query: FinancePeriodQueryDto) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.financeService.getDashboard(req.user.restaurantId, query.from, query.to);
  }

  @Get('dre')
  getDre(@Req() req: { user: User }, @Query() query: FinancePeriodQueryDto) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.financeService.getDreReport(req.user.restaurantId, query.from, query.to);
  }

  @Get('cash-closing')
  getCashClosing(@Req() req: { user: User }, @Query() query: CashClosingQueryDto) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.financeService.getCashClosing(req.user.restaurantId, query.date);
  }

  @Get('expenses')
  listExpenses(@Req() req: { user: User }, @Query() query: FinancePeriodQueryDto) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.financeService.listExpenses(req.user.restaurantId, query.from, query.to);
  }

  @Post('expenses')
  createExpense(@Req() req: { user: User }, @Body() dto: CreateExpenseDto) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.financeService.createExpense(req.user.restaurantId, dto);
  }

  @Patch('expenses/:id')
  updateExpense(
    @Param('id') id: string,
    @Req() req: { user: User },
    @Body() dto: UpdateExpenseDto,
  ) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.financeService.updateExpense(id, req.user.restaurantId, dto);
  }

  @Delete('expenses/:id')
  deleteExpense(@Param('id') id: string, @Req() req: { user: User }) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.financeService.deleteExpense(id, req.user.restaurantId);
  }
}
