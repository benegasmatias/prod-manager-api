import { MigrationInterface, QueryRunner } from 'typeorm';

export class SaaSInfrastructure1775152378479 implements MigrationInterface {
    name = 'SaaSInfrastructure1775152378479'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Business Templates extension
        await queryRunner.query(`ALTER TABLE "business_templates" ADD "config" jsonb`);
        await queryRunner.query(`ALTER TABLE "business_templates" ADD "is_available" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "business_templates" ADD "is_coming_soon" boolean NOT NULL DEFAULT false`);

        // Business extension
        await queryRunner.query(`ALTER TABLE "businesses" ADD "capabilities_override" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "capabilities_override"`);
        await queryRunner.query(`ALTER TABLE "business_templates" DROP COLUMN "is_coming_soon"`);
        await queryRunner.query(`ALTER TABLE "business_templates" DROP COLUMN "is_available"`);
        await queryRunner.query(`ALTER TABLE "business_templates" DROP COLUMN "config"`);
    }
}
