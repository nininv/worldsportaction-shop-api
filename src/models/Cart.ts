import {
    BaseEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    ManyToMany,
    JoinTable,
    CreateDateColumn
} from 'typeorm';
import { IsNumber } from "class-validator";
import { Product } from "./Product";

@Entity('cart')
export class Cart extends BaseEntity {
    @IsNumber()
    @PrimaryGeneratedColumn()
    id: number;

    @IsNumber()
    @Column()
    userId: number;

    @ManyToMany(type=> Product, product=> product.carts)
    @JoinTable()
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

    @IsNumber()
    @Column()
    isDeleted: number;
}
