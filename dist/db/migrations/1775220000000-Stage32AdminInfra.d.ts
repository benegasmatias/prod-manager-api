import { MigrationInterface, QueryRunner } from "typeorm";
export declare class Stage32AdminInfra1775220000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
