import { BaseEntity,
         Column, 
         Entity, 
         PrimaryGeneratedColumn, 
         ManyToOne,
         OneToMany,
         UpdateDateColumn, 
         OneToOne, 
         JoinColumn,
         JoinTable } 
         from 'typeorm';
import { IsNumber, IsString } from "class-validator";
import { Product } from './Product';
import { ProductVariantOption } from './ProductVariantOption';
import { SellProduct } from './SellProduct';

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

    @OneToMany(type => SellProduct, sellProduct => sellProduct.SKU)
    @JoinTable()
    sellProduct: SellProduct[];

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
