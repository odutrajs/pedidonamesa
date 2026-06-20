import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Product } from './product.entity';
import { Ingredient } from './ingredient.entity';

@Entity('product_ingredients')
@Unique(['productId', 'ingredientId'])
export class ProductIngredient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @Column()
  ingredientId: string;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  quantity: number;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne(() => Ingredient, (ingredient) => ingredient.recipeLines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ingredientId' })
  ingredient: Ingredient;

  @CreateDateColumn()
  createdAt: Date;
}
