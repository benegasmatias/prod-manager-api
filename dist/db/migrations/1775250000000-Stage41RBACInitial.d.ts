import { MigrationInterface, QueryRunner } from "typeorm";
export declare class Stage41RBACInitial1775250000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
