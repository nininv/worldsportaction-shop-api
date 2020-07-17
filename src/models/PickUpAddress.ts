import { IsNumber } from 'class-validator';
import { Column, UpdateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

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
    organisationId: number;

    @IsNumber()
    @Column()
    createdBy: number;

    @IsNumber()
    @Column({ nullable: true, default: null })
    updatedBy: number;

    @Column({ nullable: false })
    createdOn: Date;

    @UpdateDateColumn({ nullable: false })
    updatedOn: Date;
}
