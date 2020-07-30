import { OrderGroup } from './OrderGroup';
import { Courier } from './Courier';
import { User } from './User';
import { PickUpAddress } from './PickUpAddress';
import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
  ManyToOne
} from 'typeorm';
import { IsNumber, IsString } from "class-validator";
import { SellProduct } from './SellProduct';

@Entity('order')
export class Order extends BaseEntity {
  @IsNumber()
  @PrimaryGeneratedColumn()
  id: number;

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
  organisationId: number;

  @IsNumber()
  @Column()
  postcode: number;

  @OneToMany(type => SellProduct, sellProduct => sellProduct.order, { cascade: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  @JoinColumn()
  sellProducts: SellProduct[];

  @IsString()
  @Column()
  deliveryType: 'shipping' | 'pickup';

  @ManyToOne(type => PickUpAddress, pickUpAddress => pickUpAddress.orders)
  @JoinColumn()
  pickUpAddress: PickUpAddress;

  @IsString()
  @Column()
  address: string;

  @IsString()
  @Column()
  suburb: string;

  @IsString()
  @Column()
  state: string;

  @ManyToOne(type => User, user => user.id)
  @JoinColumn()
  user: User;

  @ManyToOne(type => OrderGroup, orderGroup => orderGroup.id)
  @JoinColumn()
  orderGroup: OrderGroup;

  @Column(type => Courier)
  courier: Courier;

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
