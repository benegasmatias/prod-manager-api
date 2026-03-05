import { MigrationInterface, QueryRunner } from "typeorm";
export declare class AddBusinessIdToCustomers1772546000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
