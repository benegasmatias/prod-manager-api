import { MigrationInterface, QueryRunner } from "typeorm";

export class ParallelProductionBatches1778000000000 implements MigrationInterface {
    name = 'ParallelProductionBatches1778000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Drop unique constraint on order_item_id in production_jobs
        await queryRunner.query(`
            ALTER TABLE "production_jobs" 
            DROP CONSTRAINT IF EXISTS "UQ_order_item_production_job"
        `);

        // 2. Add done_qty and failed_qty columns to production_jobs if they do not exist
        await queryRunner.query(`
            ALTER TABLE "production_jobs" 
            ADD COLUMN IF NOT EXISTS "done_qty" integer NOT NULL DEFAULT 0
        `);

        await queryRunner.query(`
            ALTER TABLE "production_jobs" 
            ADD COLUMN IF NOT EXISTS "failed_qty" integer NOT NULL DEFAULT 0
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. Remove added columns
        await queryRunner.query(`
            ALTER TABLE "production_jobs" 
            DROP COLUMN IF EXISTS "done_qty"
        `);

        await queryRunner.query(`
            ALTER TABLE "production_jobs" 
            DROP COLUMN IF EXISTS "failed_qty"
        `);

        // 2. Re-add unique constraint (caution: might fail if duplicate keys exist)
        await queryRunner.query(`
            ALTER TABLE "production_jobs" 
            ADD CONSTRAINT "UQ_order_item_production_job" UNIQUE ("order_item_id")
        `);
    }
}
