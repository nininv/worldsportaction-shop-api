
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, ManyToOne, OneToOne, UpdateDateColumn } from 'typeorm';
import { IsNumber, IsString } from "class-validator";
import { ProductVariant } from './ProductVariant';
import { SKU } from './SKU'

@Entity('productVariantOption')
export class ProductVariantOption extends BaseEntity {

    @IsNumber()
    @PrimaryGeneratedColumn()
    id: number;

    @IsString()
    @Column({ default: "" })
    optionName: string;

    @IsNumber()
    @Column()
    sortOrder: number;

    @ManyToOne(type => ProductVariant, productVariant => productVariant.options)
    variant: ProductVariant;

    @OneToOne(type => SKU, sku => sku.productVariantOption, { cascade: true })
    SKU: SKU;

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
