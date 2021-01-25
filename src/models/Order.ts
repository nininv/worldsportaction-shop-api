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
import { IsNumber, IsString, IsDate } from "class-validator";
import { SellProduct } from './SellProduct';

@Entity('order')
export class Order extends BaseEntity {

  public static P_NOT_PAID: string = "1";
  public static P_PAID: string = "2";
  public static P_REFUNDED: string = "3";
  public static P_PARTIALLY_REFUNDED: string = "4";
  public static F_TO_BE_SENT: string = "1";
  public static F_AWAITING_PICKUP: string = "2";
  public static F_IN_TRANSIT: string = "3";
  public static F_COMPLETED: string = "4";

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

  @IsDate()
  @Column()
  updatedOn: Date;

  @Column()
  paymentIntentId: string;

  @Column()
  stripeTransferId: string;

  @IsNumber()
  @Column()
  isDeleted: number;
}
