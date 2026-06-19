import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_suggestions')
@Unique(['sourceProductId', 'suggestedProductId'])
export class ProductSuggestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sourceProductId: string;

  @Column()
  suggestedProductId: string;

  @Column({ default: 0 })
  sortOrder: number;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sourceProductId' })
  sourceProduct: Product;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'suggestedProductId' })
  suggestedProduct: Product;
}
