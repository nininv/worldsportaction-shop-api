import {
    BaseEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn,
    ManyToMany,
    JoinTable,
    OneToMany
} from 'typeorm';
import { IsNumber, IsString, IsBoolean, IsArray, IsDefined } from "class-validator";
import { Type } from './Type';
import { Variant } from './Variant';

@Entity('product')
export class Product extends BaseEntity {

    @IsNumber()
    @PrimaryGeneratedColumn()
    id: number;

    @IsString()
    @IsDefined()
    @Column()
    productName: string;

    @IsString()
    @Column({ default: null })
    description: string;

    @IsString()
    @Column({ default: null })
    affiliates: string;

    @IsString()
    @Column({ default: null })
    image: string;

    @IsNumber()
    @IsDefined()
    @Column({ default: 0 })
    price: number;

    @IsNumber()
    @IsDefined()
    @Column({ default: 0 })
    cost: number;

    @IsNumber()
    @Column({ default: null })
    tax: number;

    @IsBoolean()
    @Column({ default: false })
    invetoryTracking: boolean;

    @IsString()
    @Column({ default: null })
    barcode: string;

    @IsString()
    @Column({ default: null })
    SKU: string;

    @IsNumber()
    @Column({ default: 0 })
    quantity: number;

    @IsString()
    @Column({ default: null })
    deliveryType: string;

    @ManyToMany(type => Type, type => type.products)
    @JoinTable()
    types: Type[];

    @IsNumber()
    @Column({ default: null })
    width: number;

    @IsNumber()
    @Column({ default: null })
    length: number;

    @IsNumber()
    @Column({ default: null })
    height: number;

    @IsNumber()
    @Column({ default: null })
    weight: number;

    @OneToMany(type => Variant, variant => variant.product)
    @JoinTable()
    variants: Variant[];

}
