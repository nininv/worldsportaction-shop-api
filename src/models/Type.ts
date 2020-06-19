import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { IsNumber, IsString } from "class-validator";
import { Product } from "./Product";

@Entity('type')
export class Type extends BaseEntity {

    @IsNumber()
    @PrimaryGeneratedColumn()
    id: number;

    @IsString()
    @Column()
    typeName: string;

    @ManyToMany(type => Product, product => product.types)
    @JoinTable()
    products: Product[]
}
