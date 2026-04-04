import { MigrationInterface, QueryRunner } from "typeorm";

export class Stage51SubscriptionInfra1775350000000 implements MigrationInterface {
    name = 'Stage51SubscriptionInfra1775350000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Crear el tipo enum si no existe
        await queryRunner.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'business_subscriptions_status_enum') THEN
                    CREATE TYPE "public"."business_subscriptions_status_enum" AS ENUM('TRIALING', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELED', 'EXPIRED');
                END IF;
            END $$;
        `);

        // 2. Crear tabla business_subscriptions
        await queryRunner.query(`
            CREATE TABLE "business_subscriptions" (
                "business_id" uuid NOT NULL,
                "plan" character varying(50) NOT NULL,
                "status" "public"."business_subscriptions_status_enum" NOT NULL DEFAULT 'ACTIVE',
                "current_period_start" TIMESTAMP,
                "current_period_end" TIMESTAMP,
                "trial_end_at" TIMESTAMP,
                "grace_period_end_at" TIMESTAMP,
                "cancel_at_period_end" boolean NOT NULL DEFAULT false,
                "provider" character varying(50),
                "provider_subscription_id" character varying(255),
                "provider_customer_id" character varying(255),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "REL_business_id" UNIQUE ("business_id"),
                CONSTRAINT "PK_business_subscriptions" PRIMARY KEY ("business_id")
            )
        `);

        // 3. Foreign Key
        await queryRunner.query(`
            ALTER TABLE "business_subscriptions" 
            ADD CONSTRAINT "FK_subscription_business" 
            FOREIGN KEY ("business_id") 
            REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // 4. MIGRACIÓN DE DATOS
        await queryRunner.query(`
            INSERT INTO "business_subscriptions" (business_id, plan, status, current_period_start)
            SELECT id, plan, 'ACTIVE', created_at FROM "businesses"
            ON CONFLICT (business_id) DO NOTHING
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "business_subscriptions" DROP CONSTRAINT "FK_subscription_business"`);
        await queryRunner.query(`DROP TABLE "business_subscriptions"`);
        await queryRunner.query(`DROP TYPE "public"."business_subscriptions_status_enum"`);
    }

}
