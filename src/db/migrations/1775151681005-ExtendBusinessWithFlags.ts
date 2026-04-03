import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendBusinessWithFlags1775151681005 implements MigrationInterface {
    name = 'ExtendBusinessWithFlags1775151681005'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "businesses" ADD "is_enabled" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD "is_available" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD "onboarding_completed" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "onboarding_completed"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "is_available"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "is_enabled"`);
    }
}
