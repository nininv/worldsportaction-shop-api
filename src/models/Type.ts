import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
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

    @OneToMany(type => Product, product => product)
    products: Product[];

    @IsNumber()
    @Column()
    createdBy: number;

    @IsNumber()
    @Column({ nullable: true, default: null })
    updatedBy: number;

    @CreateDateColumn()
    createdOn: Date;

    @UpdateDateColumn()
    updatedOn: string;

    @IsNumber()
    @Column()
    isDeleted: number;
}
