import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { IsNumber, IsString } from "class-validator";

@Entity('type')
export class Type extends BaseEntity {

    @IsNumber()
    @PrimaryGeneratedColumn()
    id: number;  

    @IsString()
    @Column()
    typeName: string;
}
