import { MigrationInterface, QueryRunner } from "typeorm";

export class Stage32AuditLogging1775240000000 implements MigrationInterface {
    name = 'Stage32AuditLogging1775240000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "audit_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "entity_type" varchar NOT NULL,
                "entity_id" varchar NOT NULL,
                "action" varchar NOT NULL,
                "actor_user_id" uuid,
                "business_id" uuid,
                "metadata" jsonb DEFAULT '{}',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
            )
        `);
        
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_business_id" ON "audit_logs" ("business_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_entity" ON "audit_logs" ("entity_type", "entity_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_audit_logs_entity"`);
        await queryRunner.query(`DROP INDEX "IDX_audit_logs_business_id"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
    }
}
