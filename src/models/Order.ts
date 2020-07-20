import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable
} from 'typeorm';
import { IsNumber, IsString } from "class-validator";
import { Product } from './Product';

@Entity('orders')
export class Order extends BaseEntity {
  @IsNumber()
  @PrimaryGeneratedColumn()
  id: number;

  @IsString()
  @Column()
  name: string;

  @IsNumber()
  @Column()
  userId: number;

  @IsNumber()
  @Column()
  productsCount: number;

  @IsString()
  @Column()
  paymentMethod: string;

  @IsString()
  @Column()
  paymentStatus: string;

  @IsString()
  @Column()
  fulfilmentStatus: string;

  @IsNumber()
  @Column()
  refundedAmount: number;

  @IsNumber()
  @Column()
  total: number;

  @ManyToMany(type => Product, product => product.orders)
  @JoinTable()
  products: Product[];

  @IsNumber()
  @Column()
  createdBy: number;

  @IsNumber()
  @Column({ nullable: true, default: null })
  updatedBy: number;

  @Column()
  createdOn: Date;

  @UpdateDateColumn()
  updatedOn: Date;

  @IsNumber()
  @Column()
  isDeleted: number;
}
