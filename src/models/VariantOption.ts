import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { IsNumber, IsString } from "class-validator";
import { Variant } from './Variant';
import { ProductVariantOption } from './ProductVariantOption';

@Entity('variantOption')
export class VariantOption extends BaseEntity {

    @IsNumber()
    @PrimaryGeneratedColumn()
    id: number;

    @IsString()
    @Column({ default: "" })
    optionName: string;

    @IsString()
    @Column({ default: new Date().toISOString() })
    createAt: string;

    @ManyToOne(type => Variant, variant => variant.options)
    variant: Variant;

    @OneToMany(type => ProductVariantOption, option => option.variantOption)
    properties: ProductVariantOption[];
}