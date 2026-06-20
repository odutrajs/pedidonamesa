import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserRole } from '@pedidonamesa/shared';
import { Restaurant } from './restaurant.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.ADMIN })
  role: UserRole;

  @Column({ nullable: true })
  restaurantId: string | null;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.users, { nullable: true })
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
