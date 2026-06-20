import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { PaymentMode } from '@pedidonamesa/shared';
import { User } from './user.entity';
import { Table } from './table.entity';
import { Category } from './category.entity';

@Entity('restaurants')
export class Restaurant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'enum', enum: PaymentMode, default: PaymentMode.PAY_AFTER })
  paymentMode: PaymentMode;

  @Column({ default: false })
  upsellFoodOnlyEnabled: boolean;

  @Column({ type: 'varchar', nullable: true })
  upsellDrinkCategoryId: string | null;

  @Column({ type: 'varchar', nullable: true })
  upsellFoodOnlyCategoryId: string | null;

  @Column({ default: false })
  upsellDrinksOnlyEnabled: boolean;

  @Column({ type: 'varchar', nullable: true })
  upsellDrinksOnlyCategoryId: string | null;

  @Column({ default: true })
  whatsappBotEnabled: boolean;

  @Column({ default: false })
  whatsappBotPaused: boolean;

  @Column({ type: 'text', nullable: true })
  whatsappWelcomeMessage: string | null;

  @Column({ type: 'varchar', nullable: true })
  whatsappBusinessHours: string | null;

  @Column({ type: 'text', nullable: true })
  whatsappAddress: string | null;

  @OneToMany(() => User, (user) => user.restaurant)
  users: User[];

  @OneToMany(() => Table, (table) => table.restaurant)
  tables: Table[];

  @OneToMany(() => Category, (category) => category.restaurant)
  categories: Category[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
