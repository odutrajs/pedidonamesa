import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { IngredientUnit } from '@pedidonamesa/shared';
import { Restaurant } from './restaurant.entity';
import { ProductIngredient } from './product-ingredient.entity';
import { StockMovement } from './stock-movement.entity';

@Entity('ingredients')
export class Ingredient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  restaurantId: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: IngredientUnit, default: IngredientUnit.G })
  unit: IngredientUnit;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  costPerUnit: number;

  @Column({ type: 'decimal', precision: 12, scale: 4, default: 0 })
  currentStock: number;

  @Column({ type: 'decimal', precision: 12, scale: 4, default: 0 })
  minStock: number;

  @Column({ default: true })
  active: boolean;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  @OneToMany(() => ProductIngredient, (entry) => entry.ingredient)
  recipeLines: ProductIngredient[];

  @OneToMany(() => StockMovement, (movement) => movement.ingredient)
  movements: StockMovement[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
