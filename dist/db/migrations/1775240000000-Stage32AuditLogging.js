"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stage32AuditLogging1775240000000 = void 0;
class Stage32AuditLogging1775240000000 {
    constructor() {
        this.name = 'Stage32AuditLogging1775240000000';
    }
    async up(queryRunner) {
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
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_audit_logs_entity"`);
        await queryRunner.query(`DROP INDEX "IDX_audit_logs_business_id"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
    }
}
exports.Stage32AuditLogging1775240000000 = Stage32AuditLogging1775240000000;
//# sourceMappingURL=1775240000000-Stage32AuditLogging.js.map