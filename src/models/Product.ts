import {
    BaseEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    OneToMany
} from 'typeorm';
import { IsNumber, IsString, IsBoolean, IsArray } from "class-validator";
import { Type } from './Type';
import { VariantOption } from './VariantOption';

@Entity('product')
export class Product extends BaseEntity {

    @IsNumber()
    @PrimaryGeneratedColumn()
    id: number;

    @IsString()
    @Column({ default: null })
    description: string;

    @IsString()
    @Column({ default: null })
    affiliates: string;

    @IsString()
    @Column()
    productName: string;

    @IsString()
    @Column({ default: null })
    image: string;

    @IsNumber()
    @Column({ default: 0 })
    price: number;

    @IsNumber()
    @Column({ default: 0 })
    cost: number;

    @IsNumber()
    @Column({ default: null })
    tax: number;

    @IsBoolean()
    @Column({ default: null })
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
    @JoinColumn()
    delivery: string;

    @ManyToOne(type => Type, type => type.id)
    @JoinColumn()
    type: Type;

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

    @IsString()
    @Column({ default: null })
    variantName: string;

    @IsArray({})
    @OneToMany(type => VariantOption, variantOption => VariantOption)
    variantOption: VariantOption[];

}
