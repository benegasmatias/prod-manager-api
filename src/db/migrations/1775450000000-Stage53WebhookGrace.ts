import { MigrationInterface, QueryRunner } from "typeorm";

export class Stage53WebhookGrace1775450000000 implements MigrationInterface {
    name = 'Stage53WebhookGrace1775450000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Crear el tipo enum si no existe
        await queryRunner.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'webhook_status_enum') THEN
                    CREATE TYPE "public"."webhook_status_enum" AS ENUM('RECEIVED', 'PROCESSED', 'FAILED', 'IGNORED');
                END IF;
            END $$;
        `);

        // 2. Crear tabla webhook_events
        await queryRunner.query(`
            CREATE TABLE "webhook_events" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "provider_event_id" character varying(255) NOT NULL,
                "provider" character varying(50) NOT NULL,
                "event_type" character varying(100) NOT NULL,
                "status" "public"."webhook_status_enum" NOT NULL DEFAULT 'RECEIVED',
                "business_id" uuid,
                "payload" jsonb,
                "error_message" text,
                "received_at" TIMESTAMP NOT NULL DEFAULT now(),
                "processed_at" TIMESTAMP,
                CONSTRAINT "PK_webhook_events" PRIMARY KEY ("id")
            )
        `);

        // 3. Índice de Idempotencia por Proveedor + EventID
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_webhook_idempotency" 
            ON "webhook_events" ("provider", "provider_event_id")
        `);

        // 4. Foreign Key (opcional, pero recomendada)
        await queryRunner.query(`
            ALTER TABLE "webhook_events" 
            ADD CONSTRAINT "FK_webhook_business" 
            FOREIGN KEY ("business_id") 
            REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "webhook_events" DROP CONSTRAINT "FK_webhook_business"`);
        await queryRunner.query(`DROP INDEX "IDX_webhook_idempotency"`);
        await queryRunner.query(`DROP TABLE "webhook_events"`);
        await queryRunner.query(`DROP TYPE "public"."webhook_status_enum"`);
    }

}
