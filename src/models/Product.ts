import {
    BaseEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { IsNumber, IsString, IsBoolean } from "class-validator";
import { Category } from './Category';
import { Delivery } from './Delivery';
import { Dimensions } from './Dimensions';

@Entity('product')
export class Product extends BaseEntity {

    @IsNumber()
    @PrimaryGeneratedColumn()
    id: number;

    @IsString()
    @Column()
    description: string;

    @IsString()
    @Column()
    affiliates: string;

    @IsString()
    @Column()
    productName: string;

    @IsString()
    @Column()
    image: string;

    @IsNumber()
    @Column()
    price: number;

    @IsNumber()
    @Column()
    cost: number;

    @IsNumber()
    @Column({ default: 0 })
    tax: number;

    @IsBoolean()
    @Column()
    invetoryTracking: boolean;

    @IsString()
    @Column()
    barcode: string;

    @IsString()
    @Column()
    SKU: string;

    @IsNumber()
    @Column()
    quantity: number;

    @ManyToOne(type => Delivery, delivery => delivery.id)
    @JoinColumn()
    deliveryId: Delivery;

    @ManyToOne(type => Category, category => category.id)
    @JoinColumn()
    categoryId: Category;//type

    @IsString()
    @Column()
    variantName: string;

    @Column(type => Dimensions )
    Dimensions: Dimensions;

}
