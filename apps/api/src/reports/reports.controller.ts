import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@pedidonamesa/shared';
import { JwtAuthGuard, assertRole, requireRestaurantId } from '../auth/jwt-auth.guard';
import { User } from '../entities/user.entity';
import { ReportsService } from './reports.service';

class ReportsPeriodQueryDto {
  from?: string;
  to?: string;
}

@Controller('admin/reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  getDashboard(@Req() req: { user: User }, @Query() query: ReportsPeriodQueryDto) {
    assertRole(req.user, [UserRole.ADMIN]);
    return this.reportsService.getDashboard(
      requireRestaurantId(req.user),
      query.from,
      query.to,
    );
  }
}
