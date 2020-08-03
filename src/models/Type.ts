import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IsNumber, IsString, IsDate } from "class-validator";
import { Product } from "./Product";

@Entity('type')
export class Type extends BaseEntity {

    @IsNumber()
    @PrimaryGeneratedColumn()
    id: number;

    @IsString()
    @Column()
    typeName: string;

    @OneToMany(type => Product, product => product)
    products: Product[];

    @IsNumber()
    @Column()
    createdBy: number;

    @IsNumber()
    @Column({ nullable: true, default: null })
    updatedBy: number;

    @Column()
    createdOn: Date;

    @IsDate()
    @Column()
    updatedOn: Date;

    @IsNumber()
    @Column()
    isDeleted: number;
}
