import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { IsNumber, IsString } from "class-validator";
import { Product } from './Product';

@Entity('variantOption')
export class VariantOption extends BaseEntity {

    @IsNumber()
    @PrimaryGeneratedColumn()
    id: number;

    @IsString()
    @Column()
    optionName: string;

    @IsNumber()
    @Column()
    price: number;

    @IsString()
    @Column()
    SKU: string;

    @IsString()
    @Column()
    barcode: string;

    @IsString()
    @Column()
    quantity: number;

    @IsNumber()
    @ManyToOne(type => Product, product => Product)
    product: number;

}
