import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany } from "typeorm";
import { IsNumber, IsString } from 'class-validator';
import { Product } from './Product';
import { VariantOption } from './VariantOption'
@Entity('variant')
export class Variant extends BaseEntity {
  @IsNumber()
  @PrimaryGeneratedColumn()
  id: number;

  @IsString()
  @Column()
  name: string;

  @ManyToOne(type => Product, product => product.variants)
  product: Product;

  @OneToMany(type => VariantOption, option => option.variant)
  options: VariantOption[];
}