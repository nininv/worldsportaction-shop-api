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
import { Order } from './Order';

@Entity('orderGroup')
export class OrderGroup extends BaseEntity {
    @IsNumber()
    @PrimaryGeneratedColumn()
    id: number;

    @OneToMany(type => Order, order => order.orderGroup, { cascade: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
    @JoinTable()
    orders: Order[];

    @IsNumber()
    @Column()
    total: number;

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
