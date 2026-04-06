import { MigrationInterface, QueryRunner } from "typeorm";
export declare class Stage3BusinessLifecycle1775210000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
