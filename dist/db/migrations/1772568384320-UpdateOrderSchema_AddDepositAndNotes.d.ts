import { MigrationInterface, QueryRunner } from "typeorm";
export declare class UpdateOrderSchemaAddDepositAndNotes1772568384320 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
