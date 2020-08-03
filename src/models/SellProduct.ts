import {
    BaseEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn,
    JoinColumn,
    UpdateDateColumn,
    ManyToOne
} from 'typeorm';
import { IsNumber, IsString, IsDate } from "class-validator";
import { SKU } from './SKU';
import { Order } from './Order';
import { Cart } from './Cart';
import { Product } from './Product';

@Entity('sellProduct')
export class SellProduct extends BaseEntity {

    @IsNumber()
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => Product, product => product.sellProducts)
    @JoinColumn()
    product: Product;

    @ManyToOne(type => SKU, sku => sku.product)
    @JoinColumn()
    SKU: SKU;

    @ManyToOne(type => Order, order => order.sellProducts)
    @JoinColumn()
    order: Order;

    @ManyToOne(type => Cart, cart => cart.sellProducts)
    @JoinColumn()
    cart: Cart;

    @IsNumber()
    @Column()
    createdBy: number;

    @IsNumber()
    @Column({ nullable: true, default: null })
    updatedBy: number;

    @Column({ nullable: false })
    createdOn: Date;

    @IsDate()
    @Column()
    updatedOn: Date;

    @IsNumber()
    @Column()
    isDeleted: number;

    @IsString()
    @Column({ default: 0 })
    quantity: number;
}
