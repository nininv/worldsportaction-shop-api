import {
    BaseEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn,
    ManyToMany,
    JoinTable,
    OneToMany,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { IsNumber, IsString, IsBoolean, IsDefined } from "class-validator";
import { Type } from './Type';
import { ProductVariantOption } from './ProductVariantOption';
import { Affiliates } from './Affiliates';
import { PickUpAddress } from './PickUpAddress';
import { Image } from "./Image";

@Entity('product')
export class Product extends BaseEntity {

    @IsNumber()
    @PrimaryGeneratedColumn()
    id: number;

    @IsString()
    @IsDefined()
    @Column()
    productName: string;

    @IsString()
    @Column({ default: null })
    description: string;

    @Column(type => PickUpAddress)
    pickUpAddress: PickUpAddress;

    @Column(type => Affiliates)
    affiliates: Affiliates;

    @OneToMany(type => Image, image => image.product, { cascade: true })
    @JoinColumn({ name: 'productImages' })
    images: Image[];

    @IsNumber()
    @IsDefined()
    @Column({ default: 0 })
    price: number;

    @IsNumber()
    @IsDefined()
    @Column({ default: 0 })
    cost: number;

    @IsNumber()
    @Column({ default: null })
    tax: number;

    @IsBoolean()
    @Column({ default: false })
    inventoryTracking: boolean;

    @IsString()
    @Column({ default: null })
    barcode: string;

    @IsString()
    @Column({ default: null })
    SKU: string;

    @IsNumber()
    @Column({ default: 0 })
    quantity: number;

    @IsString()
    @Column({ default: null })
    deliveryType: string;

    @ManyToMany(type => Type, type => type.products)
    @JoinTable({ name: 'productTypes' })
    types: Type[];

    @IsNumber()
    @Column({ default: null })
    width: number;

    @IsNumber()
    @Column({ default: null })
    length: number;

    @IsNumber()
    @Column({ default: null })
    height: number;

    @IsNumber()
    @Column({ default: null })
    weight: number;

    @IsNumber()
    @Column({ default: null })
    createByOrg: number;

    @OneToMany(type => ProductVariantOption, productVariantOption => productVariantOption.product)
    @JoinTable()
    variantOptions: ProductVariantOption[];

    @IsNumber()
    @Column()
    createdBy: number;

    @IsNumber()
    @Column({ nullable: true, default: null })
    updatedBy: number;

    @Column({ nullable: false})
    createdOn: Date;

    @UpdateDateColumn({ nullable: false})
    updatedOn: Date;
}
