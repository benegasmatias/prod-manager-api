import { MigrationInterface, QueryRunner } from "typeorm";
export declare class Stage32Traceability1775230000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
