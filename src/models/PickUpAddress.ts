import { Order } from './Order';
import { IsNumber, IsString, IsDate } from 'class-validator';
import { Column, UpdateDateColumn, Entity, PrimaryGeneratedColumn, OneToMany, JoinColumn } from "typeorm";

@Entity('pickUpAddress')
export class PickUpAddress {
    @IsNumber()
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: null })
    address: string;

    @Column({ default: null })
    suburb: string;

    @Column({ default: null })
    postcode: number;

    @Column({ default: null })
    state: string;

    @Column({ default: null })
    pickupInstruction: string;

    @Column({ default: null })
    organisationId: number;

    @IsString()
    @Column({ default: null })
    organisationUniqueKey: string;

    @OneToMany(type => Order, order => order.pickUpAddress)
    @JoinColumn()
    orders: Order[];

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
}
