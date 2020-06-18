import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinTable } from 'typeorm';
import { IsNumber, IsString } from "class-validator";
import { Product } from './Product';
import { VariantOption } from './VariantOption';

@Entity('variant')
export class Variant extends BaseEntity {

    @IsNumber()
    @PrimaryGeneratedColumn()
    id: number;

    @IsString()
    @Column()
    name: string;

    @OneToMany(type => VariantOption, variantOption => variantOption)
    @JoinTable()
    variantOption: VariantOption[];

    @ManyToOne(type => Product, product => product.id)
    @JoinTable()
    product: Product;

}
