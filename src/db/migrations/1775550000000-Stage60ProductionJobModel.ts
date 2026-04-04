import { MigrationInterface, QueryRunner } from "typeorm";

export class Stage60ProductionJobModel1775550000000 implements MigrationInterface {
    name = 'Stage60ProductionJobModel1775550000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Crear los tipos enum
        await queryRunner.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'production_job_status_enum') THEN
                    CREATE TYPE "public"."production_job_status_enum" AS ENUM('QUEUED', 'IN_PROGRESS', 'PAUSED', 'DONE', 'FAILED', 'CANCELLED');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'production_job_priority_enum') THEN
                    CREATE TYPE "public"."production_job_priority_enum" AS ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT');
                END IF;
            END $$;
        `);

        // 2. Eliminar tabla vieja si existe (refactor total)
        await queryRunner.query(`DROP TABLE IF EXISTS "production_jobs" CASCADE`);

        // 3. Crear tabla production_jobs refinada
        await queryRunner.query(`
            CREATE TABLE "production_jobs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "business_id" uuid NOT NULL,
                "order_id" uuid NOT NULL,
                "order_item_id" uuid NOT NULL,
                "machine_id" uuid,
                "operator_id" uuid,
                "status" "public"."production_job_status_enum" NOT NULL DEFAULT 'QUEUED',
                "priority" "public"."production_job_priority_enum" NOT NULL DEFAULT 'NORMAL',
                "current_stage" character varying(100),
                "sequence" integer NOT NULL DEFAULT 0,
                "started_at" TIMESTAMP,
                "completed_at" TIMESTAMP,
                "estimated_minutes" integer,
                "actual_minutes" integer,
                "pause_reason" text,
                "metadata" jsonb,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_order_item_production_job" UNIQUE ("order_item_id"),
                CONSTRAINT "PK_production_jobs" PRIMARY KEY ("id")
            )
        `);

        // 4. Foreign Keys
        await queryRunner.query(`
            ALTER TABLE "production_jobs" 
            ADD CONSTRAINT "FK_prod_job_business" 
            FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE;

            ALTER TABLE "production_jobs" 
            ADD CONSTRAINT "FK_prod_job_order" 
            FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE;

            ALTER TABLE "production_jobs" 
            ADD CONSTRAINT "FK_prod_job_item" 
            FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE;

            ALTER TABLE "production_jobs" 
            ADD CONSTRAINT "FK_prod_job_machine" 
            FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE SET NULL;

            ALTER TABLE "production_jobs" 
            ADD CONSTRAINT "FK_prod_job_operator" 
            FOREIGN KEY ("operator_id") REFERENCES "employees"("id") ON DELETE SET NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "production_jobs"`);
        await queryRunner.query(`DROP TYPE "public"."production_job_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."production_job_priority_enum"`);
    }

}
