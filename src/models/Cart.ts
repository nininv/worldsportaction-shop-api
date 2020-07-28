import {
    BaseEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
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

    @OneToMany(type => SellProduct, sellProduct => sellProduct.cart, { cascade: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
    @JoinTable()
    sellProducts: SellProduct[];

    @IsNumber()
    @Column()
    createdBy: number;

    @IsNumber()
    @Column({ nullable: true, default: null })
    updatedBy: number;

    @CreateDateColumn()
    createdOn: Date;

    @UpdateDateColumn()
    updatedOn: Date;

    @IsNumber()
    @Column()
    isDeleted: number;
}
