import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MenuChannel,
  ORDER_STATUS_LABELS,
  WhatsAppBotConfigDto,
  WhatsAppOrderStatusDto,
  isProductOnChannel,
} from '@pedidonamesa/shared';
import { Restaurant } from '../entities/restaurant.entity';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { Order } from '../entities/order.entity';

@Injectable()
export class BotService {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Restaurant)
    private readonly restaurantsRepo: Repository<Restaurant>,
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
  ) {}

  async getPublicConfig(slug: string): Promise<WhatsAppBotConfigDto> {
    const restaurant = await this.restaurantsRepo.findOne({
      where: { slug, active: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    const webBaseUrl = this.config.get<string>('WEB_BASE_URL', 'http://localhost:5173').replace(/\/$/, '');
    const menuSummary = await this.buildMenuSummary(restaurant.id);

    const defaultWelcome = `Olá! 👋 Sou o assistente virtual do *${restaurant.name}*.\n\nPosso te enviar o cardápio, tirar dúvidas ou informar o status do seu pedido.\n\nDigite *cardápio* para fazer seu pedido online!`;

    return {
      enabled: restaurant.whatsappBotEnabled,
      paused: restaurant.whatsappBotPaused,
      restaurantName: restaurant.name,
      slug: restaurant.slug,
      description: restaurant.description,
      welcomeMessage: restaurant.whatsappWelcomeMessage?.trim() || defaultWelcome,
      businessHours: restaurant.whatsappBusinessHours,
      address: restaurant.whatsappAddress,
      deliveryMenuUrl: `${webBaseUrl}/entrega/${restaurant.slug}`,
      menuSummary,
    };
  }

  async getLatestOrderByPhone(slug: string, phone: string): Promise<WhatsAppOrderStatusDto> {
    const restaurant = await this.restaurantsRepo.findOne({
      where: { slug, active: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    const normalizedPhone = this.normalizePhone(phone);
    const orders = await this.ordersRepo.find({
      where: { restaurantId: restaurant.id, channel: MenuChannel.DELIVERY },
      relations: ['items'],
      order: { createdAt: 'DESC' },
      take: 20,
    });

    const order = orders.find((entry) => {
      if (!entry.customerPhone) return false;
      return this.normalizePhone(entry.customerPhone) === normalizedPhone;
    });

    if (!order) {
      return { found: false };
    }

    const items = order.items
      .map((item) => `${item.quantity}x ${item.productName}`)
      .join(', ');

    return {
      found: true,
      order: {
        id: order.id,
        status: order.status,
        total: Number(order.total),
        createdAt: order.createdAt.toISOString(),
        items,
      },
    };
  }

  private async buildMenuSummary(restaurantId: string): Promise<string> {
    const categories = await this.categoriesRepo.find({
      where: { restaurantId, active: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    const products = await this.productsRepo
      .createQueryBuilder('product')
      .innerJoin('product.category', 'category')
      .where('category.restaurantId = :restaurantId', { restaurantId })
      .andWhere('product.available = :available', { available: true })
      .orderBy('product.sortOrder', 'ASC')
      .getMany();

    const lines: string[] = [];

    for (const category of categories) {
      const categoryProducts = products.filter(
        (product) =>
          product.categoryId === category.id && isProductOnChannel(product, MenuChannel.DELIVERY),
      );

      if (categoryProducts.length === 0) continue;

      lines.push(`*${category.name}*`);
      for (const product of categoryProducts.slice(0, 8)) {
        lines.push(`- ${product.name}: R$ ${Number(product.price).toFixed(2).replace('.', ',')}`);
      }
      if (categoryProducts.length > 8) {
        lines.push(`  ... e mais ${categoryProducts.length - 8} itens`);
      }
    }

    return lines.join('\n') || 'Cardápio disponível no link de delivery.';
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '').slice(-11);
  }

  formatOrderStatusMessage(order: NonNullable<WhatsAppOrderStatusDto['order']>): string {
    const statusLabel = ORDER_STATUS_LABELS[order.status];
    return (
      `📦 *Status do seu pedido*\n\n` +
      `Itens: ${order.items}\n` +
      `Total: R$ ${order.total.toFixed(2).replace('.', ',')}\n` +
      `Situação: *${statusLabel}*\n\n` +
      `Pedido feito em ${new Date(order.createdAt).toLocaleString('pt-BR')}.`
    );
  }
}
