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
import { OrderStatus, PaymentMethod, PaymentStatus, MenuChannel } from '@pedidonamesa/shared';
import { Table } from './table.entity';
import { OrderItem } from './order-item.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: MenuChannel, default: MenuChannel.TABLE })
  channel: MenuChannel;

  @Column({ type: 'varchar', nullable: true })
  tableId: string | null;

  @Column()
  restaurantId: string;

  @Column({ type: 'varchar', nullable: true })
  customerName: string | null;

  @Column({ type: 'varchar', nullable: true })
  customerPhone: string | null;

  @Column({ type: 'text', nullable: true })
  deliveryAddress: string | null;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.NOT_REQUIRED })
  paymentStatus: PaymentStatus;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod: PaymentMethod | null;

  @Column({ type: 'varchar', nullable: true })
  stripePaymentIntentId: string | null;

  @Column({ type: 'varchar', nullable: true })
  mercadoPagoPaymentId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @ManyToOne(() => Table, (table) => table.orders, { nullable: true })
  @JoinColumn({ name: 'tableId' })
  table: Table | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
