import {
    BaseEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn,
    JoinTable,
    OneToMany,
    JoinColumn,
    UpdateDateColumn,
    ManyToOne,
    ManyToMany
} from 'typeorm';
import { IsNumber, IsString, IsBoolean, IsDefined, IsDate } from "class-validator";
import { Type } from './Type';
import { Affiliates } from './Affiliates';
import { SKU } from './SKU';
import { Image } from "./Image";
import { ProductVariant } from './ProductVariant';
import { SellProduct } from './SellProduct';

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

    @OneToMany(type => Image, image => image.product, { cascade: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
    @JoinColumn({ name: 'productImages' })
    images: Image[];

    @ManyToOne(type => Type, type => type.products, { cascade: true })
    @JoinTable({ name: 'typeId' })
    type: Type;

    @Column(type => Affiliates)
    affiliates: Affiliates;

    @IsNumber()
    @Column()
    tax: number;

    @IsBoolean()
    @Column({ default: false })
    inventoryTracking: boolean;

    @IsNumber()
    @Column({ default: null })
    createByOrg: number;

    @IsString()
    @Column({ default: null })
    organisationUniqueKey: string;

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

    @OneToMany(type => SellProduct, sellProduct=>sellProduct.product)
    @JoinColumn()
    sellProducts:SellProduct[];

    @IsNumber()
    @Column()
    createdBy: number;

    @IsNumber()
    @Column({ nullable: true, default: null })
    updatedBy: number;

    @Column({ nullable: false })
    createdOn: Date;

    @IsDate()
    @Column()
    updatedOn: Date;

    @IsNumber()
    @Column()
    isDeleted: number;
}
