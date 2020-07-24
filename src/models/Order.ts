import { SKU } from './SKU';
import { User } from './User';
import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn
} from 'typeorm';
import { IsNumber, IsString } from "class-validator";
import { Product } from './Product';
import { SellProduct } from './SellProduct';

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

  @IsNumber()
  @Column()
  organisationId: number;

  @IsNumber()
  @Column()
  postcode: number;

  @IsNumber()
  @Column()
  userId: number;

  @OneToMany(type => SellProduct, sellProduct => sellProduct.order)
  @JoinColumn()
  sellProducts: SellProduct[];

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
