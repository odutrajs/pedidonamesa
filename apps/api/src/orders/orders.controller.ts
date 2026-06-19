import {
  Body,
  Controller,
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
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  CreateDeliveryOrderDto,
  UpdateOrderItemStatusDto,
  UpdateOrderStatusDto,
} from './dto/order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('mesa/:token')
  createFromTable(@Param('token') token: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.createFromTableToken(token, dto);
  }

  @Post('entrega/:slug')
  createFromDelivery(@Param('slug') slug: string, @Body() dto: CreateDeliveryOrderDto) {
    return this.ordersService.createFromDeliverySlug(slug, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('kitchen')
  getKitchenOrders(@Req() req: { user: User }) {
    assertRole(req.user, [UserRole.ADMIN, UserRole.KITCHEN, UserRole.WAITER]);
    return this.ordersService.getKitchenOrders(req.user.restaurantId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('active')
  getActiveOrders(@Req() req: { user: User }) {
    assertRole(req.user, [UserRole.ADMIN, UserRole.KITCHEN, UserRole.WAITER]);
    return this.ordersService.getActiveOrdersForRestaurant(req.user.restaurantId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Req() req: { user: User },
  ) {
    assertRole(req.user, [UserRole.ADMIN, UserRole.KITCHEN, UserRole.WAITER]);
    return this.ordersService.updateOrderStatus(id, req.user.restaurantId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('items/:itemId/status')
  updateItemStatus(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateOrderItemStatusDto,
    @Req() req: { user: User },
  ) {
    assertRole(req.user, [UserRole.ADMIN, UserRole.KITCHEN]);
    return this.ordersService.updateOrderItemStatus(itemId, req.user.restaurantId, dto);
  }
}
