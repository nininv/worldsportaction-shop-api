import {
    BaseEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    ManyToMany,
    JoinTable,
    CreateDateColumn,
    OneToMany
} from 'typeorm';
import { IsNumber } from "class-validator";
import { SellProduct } from "./SellProduct";

@Entity('cart')
export class Cart extends BaseEntity {
    @IsNumber()
    @PrimaryGeneratedColumn()
    id: number;

    @OneToMany(type => SellProduct, sellProduct => sellProduct.cart)
    @JoinTable()
    sellProducts: SellProduct[];
  
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
