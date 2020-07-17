import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, ManyToOne, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
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

    @ManyToOne(type => Product, product => product.SKU)
    product: Product;

    @OneToOne(type => ProductVariantOption, ProductVariantOption => ProductVariantOption.properties)
    @JoinColumn()
    productVariantOption: ProductVariantOption;

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
