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
import { OrderStatus, OrderItemStatus } from '@pedidonamesa/shared';

export class CreateOrderItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
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

export class UpdateOrderStatusDto {
  @IsString()
  status: OrderStatus;
}

export class UpdateOrderItemStatusDto {
  @IsString()
  status: OrderItemStatus;
}
