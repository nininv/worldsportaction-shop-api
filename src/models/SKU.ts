import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { IsNumber, IsString } from "class-validator";
import { Product } from './Product';
import { ProductVariantOption } from './ProductVariantOption';

@Entity('SKU')
export class SKU extends BaseEntity {

    @IsNumber()
    @PrimaryGeneratedColumn()
    id: number;

    @IsNumber()
    @Column({ default: 0 })
    price: number;

    @IsNumber()
    @Column({ default: 0 })
    cost: number;

    @IsString()
    @Column({ default: null })
    skuCode: string;

    @IsString()
    @Column({ default: null })
    barcode: string;

    @IsString()
    @Column({ default: 0 })
    quantity: number;

    @IsString()
    @Column({ default: 0 })
    tax: number;

    @ManyToOne(type => Product, product => product.SKU)
    product: Product;

    @OneToOne(type => ProductVariantOption, ProductVariantOption => ProductVariantOption.SKU)
    @JoinColumn()
    productVariantOption: ProductVariantOption;

    @CreateDateColumn()
    createdOn: Date;

    @UpdateDateColumn()
    updatedOn: string;

    @IsNumber()
    @Column()
    isDeleted: number;
}
