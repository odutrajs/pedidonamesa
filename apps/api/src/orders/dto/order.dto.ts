import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
  ArrayMinSize,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, OrderItemStatus, MenuChannel } from '@pedidonamesa/shared';

export class CreateOrderItemSelectionDto {
  @IsUUID()
  groupId: string;

  @IsUUID()
  optionId: string;
}

export class CreateOrderItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemSelectionDto)
  selections?: CreateOrderItemSelectionDto[];
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateDeliveryOrderDto extends CreateOrderDto {
  @IsString()
  customerName: string;

  @IsString()
  customerPhone: string;

  @IsString()
  deliveryAddress: string;
}

export class UpdateOrderStatusDto {
  @IsString()
  status: OrderStatus;
}

export class UpdateOrderItemStatusDto {
  @IsString()
  status: OrderItemStatus;
}
