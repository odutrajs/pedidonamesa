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
