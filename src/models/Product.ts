import {
    BaseEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn,
    JoinTable,
    OneToMany,
    JoinColumn,
    UpdateDateColumn,
    ManyToOne
} from 'typeorm';
import { IsNumber, IsString, IsBoolean, IsDefined } from "class-validator";
import { Type } from './Type';
import { SKU } from './SKU';
import { Affiliates } from './Affiliates';
import { PickUpAddress } from './PickUpAddress';
import { Image } from "./Image";
import { ProductVariant } from './ProductVariant';

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

    @OneToMany(type => Image, image => image.product, { cascade: true })
    @JoinColumn({ name: 'productImages' })
    images: Image[];

    @ManyToOne(type => Type, type => type.products, { cascade: true })
    @JoinTable({ name: 'typeId' })
    type: Type;

    @Column(type => Affiliates)
    affiliates: Affiliates;

    @IsBoolean()
    @Column({ default: false })
    inventoryTracking: boolean;

    @IsNumber()
    @Column({ default: null })
    createByOrg: number;

    @IsString()
    @Column({ default: null })
    deliveryType: string;
    
    @IsNumber()
    @Column({ default: 0 })
    availableIfOutOfStock: number;

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


    @OneToMany(type => SKU, sku => sku.product)
    @JoinTable()
    SKU: SKU[];

    @OneToMany(type => ProductVariant, productVariant => productVariant.product, { cascade: true })
    @JoinColumn()
    variants: ProductVariant[];

    @Column(type => PickUpAddress)
    pickUpAddress: PickUpAddress;

    @IsNumber()
    @Column()
    createdBy: number;

    @IsNumber()
    @Column({ nullable: true, default: null })
    updatedBy: number;

    @Column({ nullable: false })
    createdOn: Date;

    @UpdateDateColumn({ nullable: false })
    updatedOn: Date;

    @IsNumber()
    @Column()
    isDeleted: number;
}
