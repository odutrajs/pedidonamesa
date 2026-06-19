import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';
import { PaymentMode, MenuChannel, ProductOptionGroupDto } from '@pedidonamesa/shared';

function parsePrice(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.');
    if (!normalized) return NaN;
    return parseFloat(normalized);
  }
  return NaN;
}

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class ReorderCategoriesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  orderedIds: string[];
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null ? undefined : String(value)))
  @IsString()
  description?: string;

  @Type(() => Number)
  @Transform(({ value }) => parsePrice(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(MenuChannel, { each: true })
  channels?: MenuChannel[];

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as ProductOptionGroupDto[];
      } catch {
        return [];
      }
    }
    return value;
  })
  @IsArray()
  optionGroups?: ProductOptionGroupDto[];
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => (value == null ? undefined : parsePrice(value)))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(MenuChannel, { each: true })
  channels?: MenuChannel[];

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as ProductOptionGroupDto[];
      } catch {
        return [];
      }
    }
    return value;
  })
  @IsArray()
  optionGroups?: ProductOptionGroupDto[];
}

export class CreateTableDto {
  @IsInt()
  @Min(1)
  number: number;

  @IsOptional()
  @IsString()
  label?: string;
}

export class UpdateTableDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  number?: number;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateRestaurantSettingsDto {
  @IsOptional()
  @IsEnum(PaymentMode)
  paymentMode?: PaymentMode;

  @IsOptional()
  @IsBoolean()
  upsellFoodOnlyEnabled?: boolean;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID('4')
  upsellDrinkCategoryId?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID('4')
  upsellFoodOnlyCategoryId?: string | null;

  @IsOptional()
  @IsBoolean()
  upsellDrinksOnlyEnabled?: boolean;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID('4')
  upsellDrinksOnlyCategoryId?: string | null;
}

export class UpdateProductSuggestionsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  suggestedProductIds: string[];
}
