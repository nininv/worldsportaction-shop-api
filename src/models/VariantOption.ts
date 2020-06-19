import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { IsNumber, IsString } from "class-validator";
import { Variant } from './Variant';

@Entity('variantOption')
export class VariantOption extends BaseEntity {

    @IsNumber()
    @PrimaryGeneratedColumn()
    id: number;

    @IsNumber()
    @Column({ default: 0 })
    price: number;

    @IsString()
    @Column({ default: "" })
    optionName: string;

    @IsString()
    @Column({ default: null })
    SKU: string;

    @IsString()
    @Column({ default: null })
    barcode: string;

    @IsString()
    @Column({ default: 0 })
    quantity: number;

    @ManyToOne(type => Variant, variant => variant.options)
    variant: Variant;
}