import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IngredientUnit } from '@pedidonamesa/shared';

export class CreateIngredientDto {
  @IsString()
  name: string;

  @IsEnum(IngredientUnit)
  unit: IngredientUnit;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPerUnit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentStock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number;
}

export class UpdateIngredientDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(IngredientUnit)
  unit?: IngredientUnit;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPerUnit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class StockMovementDto {
  @IsUUID('4')
  ingredientId: string;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RecipeLineDto {
  @IsUUID('4')
  ingredientId: string;

  @IsNumber()
  @Min(0.0001)
  quantity: number;
}

export class UpdateProductRecipeDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeLineDto)
  lines: RecipeLineDto[];
}

export class InventoryCountLineInputDto {
  @IsUUID('4')
  ingredientId: string;

  @IsNumber()
  @Min(0)
  physicalQuantity: number;
}

export class SubmitInventoryCountDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryCountLineInputDto)
  lines: InventoryCountLineInputDto[];
}

export class CmvReportQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
