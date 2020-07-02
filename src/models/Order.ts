import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { IsNumber, IsString } from "class-validator";

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
  products: number;

  @IsString()
  @Column()
  paymentStatus: string;

  @IsString()
  @Column()
  fulfilmentStatus: string;

  @IsNumber()
  @Column()
  total: number;

  @IsNumber()
  @Column()
  createdBy: number;

  @IsNumber()
  @Column({ nullable: true, default: null })
  updatedBy: number;

  @Column({ nullable: false })
  createdOn: Date;

  @UpdateDateColumn({ nullable: false })
  updatedOn: Date;

  @IsNumber()
  @Column()
  isDeleted: number;

}