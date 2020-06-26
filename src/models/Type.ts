import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
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
    @JoinTable({ name: 'productTypes' })
    products: Product[];

    @IsNumber()
    @Column()
    createdBy: number;

    @IsNumber()
    @Column({ nullable: true, default: null })
    updatedBy: number;

    @CreateDateColumn()
    createdOn: string;

    @UpdateDateColumn()
    updatedOn: string;
}
