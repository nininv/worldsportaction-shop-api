import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IsNumber, IsString } from "class-validator";
import { Product } from './Product';
import { VariantOption } from './VariantOption';

@Entity('productVariantOption')
export class ProductVariantOption extends BaseEntity {

    @IsNumber()
    @PrimaryGeneratedColumn()
    id: number;

    @IsNumber()
    @Column({ default: 0 })
    price: number;

    @IsString()
    @Column({ default: null })
    SKU: string;

    @IsString()
    @Column({ default: null })
    barcode: string;

    @IsString()
    @Column({ default: 0 })
    quantity: number;

    @ManyToOne(type => Product, product => product.variantOptions)
    product: Product;

    @ManyToOne(type => VariantOption, variantOption => variantOption.properties)
    variantOption: VariantOption;

    @CreateDateColumn()
    createdOn: string;

    @UpdateDateColumn()
    updatedOn: string;
}
