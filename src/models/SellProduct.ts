import {
    BaseEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn,
    JoinTable,
    OneToMany,
    JoinColumn,
    UpdateDateColumn,
    ManyToOne
} from 'typeorm';
import { IsNumber, IsString } from "class-validator";
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

    @OneToMany(type => SKU, sku => sku.product)
    @JoinTable()
    SKU: SKU[];

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

    @UpdateDateColumn({ nullable: false })
    updatedOn: Date;

    @IsNumber()
    @Column()
    isDeleted: number;

    @IsNumber()
    @Column({ default: 0 })
    price: number;

    @IsNumber()
    @Column({ default: 0 })
    cost: number;

    @IsString()
    @Column({ default: 0 })
    quantity: number;
}
