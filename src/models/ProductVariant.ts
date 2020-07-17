import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import { IsNumber, IsString } from 'class-validator';
import { ProductVariantOption } from './ProductVariantOption'
import { Product } from "./Product";

@Entity('productVariant')
export class ProductVariant extends BaseEntity {
  @IsNumber()
  @PrimaryGeneratedColumn()
  id: number;

  @IsString()
  @Column()
  name: string;

  @OneToMany(type => ProductVariantOption, option => option.variant, { cascade: true, onDelete: "CASCADE", onUpdate: "CASCADE" })
  options: ProductVariantOption[];

  @ManyToOne(type => Product, product => product.variants)
  product: Product;

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
