import { MigrationInterface, QueryRunner } from "typeorm";

export class Stage32AdminInfra1775220000000 implements MigrationInterface {
    name = 'Stage32AdminInfra1775220000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Business - Admin status reasons and gating
        await queryRunner.query(`ALTER TABLE "businesses" ADD "status_reason_code" varchar`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD "status_reason_text" text`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD "plan" varchar DEFAULT 'FREE'`);
        
        // BusinessTemplate - Gating requirements
        await queryRunner.query(`ALTER TABLE "business_templates" ADD "required_plan" varchar DEFAULT 'FREE'`);
        
        // User - Plan level
        await queryRunner.query(`ALTER TABLE "users" ADD "plan" varchar DEFAULT 'FREE'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "plan"`);
        await queryRunner.query(`ALTER TABLE "business_templates" DROP COLUMN "required_plan"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "plan"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "status_reason_text"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "status_reason_code"`);
    }
}
