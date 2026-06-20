import { Controller, Get, Param, Query } from '@nestjs/common';
import { BotService } from './bot.service';

@Controller('bot')
export class BotController {
  constructor(private readonly botService: BotService) {}

  @Get(':slug/config')
  getConfig(@Param('slug') slug: string) {
    return this.botService.getPublicConfig(slug);
  }

  @Get(':slug/orders/latest')
  getLatestOrder(@Param('slug') slug: string, @Query('phone') phone: string) {
    return this.botService.getLatestOrderByPhone(slug, phone ?? '');
  }
}
