import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IsNumber, IsString } from "class-validator";
@Entity('variantOption')
export class VariantOption extends BaseEntity {

    @IsNumber()
    @PrimaryGeneratedColumn()
    id: number;

    @IsString()
    @Column()
    optionName: string;

    @IsNumber()
    @Column()
    price: number;

    @IsString()
    @Column()
    SKU: string;

    @IsString()
    @Column()
    barcode: string;

    @IsString()
    @Column()
    quantity: number;
}
