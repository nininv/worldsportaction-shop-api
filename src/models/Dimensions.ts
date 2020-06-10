import { Entity, PrimaryColumn } from "typeorm";
import { IsNumber} from "class-validator";

@Entity()
export class Dimensions {

    @IsNumber()
    @PrimaryColumn()
    width: number;

    @IsNumber()
    @PrimaryColumn()
    length: number;

    @IsNumber()
    @PrimaryColumn()
    height: number;

    @IsNumber()
    @PrimaryColumn()
    weight: number;
}
