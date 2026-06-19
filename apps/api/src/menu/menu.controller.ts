import { Controller, Get, Param } from '@nestjs/common';
import { MenuService } from './menu.service';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('mesa/:token')
  getMenuByTable(@Param('token') token: string) {
    return this.menuService.getMenuByTableToken(token);
  }
}
