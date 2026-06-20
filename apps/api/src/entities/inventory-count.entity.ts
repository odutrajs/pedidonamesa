import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { IngredientUnit } from '@pedidonamesa/shared';
import { Restaurant } from './restaurant.entity';

@Entity('inventory_counts')
export class InventoryCount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  restaurantId: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalVarianceCost: number;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  @OneToMany(() => InventoryCountLine, (line) => line.inventoryCount, { cascade: true })
  lines: InventoryCountLine[];

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('inventory_count_lines')
export class InventoryCountLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  inventoryCountId: string;

  @Column()
  ingredientId: string;

  @Column()
  ingredientName: string;

  @Column({ type: 'enum', enum: IngredientUnit })
  unit: IngredientUnit;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  systemQuantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  physicalQuantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  variance: number;

  @Column({ type: 'decimal', precision: 12, scale: 4, default: 0 })
  unitCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  varianceCost: number;

  @ManyToOne(() => InventoryCount, (count) => count.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inventoryCountId' })
  inventoryCount: InventoryCount;
}
