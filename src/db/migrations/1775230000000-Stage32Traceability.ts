import { MigrationInterface, QueryRunner } from "typeorm";

export class Stage32Traceability1775230000000 implements MigrationInterface {
    name = 'Stage32Traceability1775230000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "businesses" ADD "status_updated_at" TIMESTAMP DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "status_updated_at"`);
    }
}
