"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stage61OrderItemStatus1775650000000 = void 0;
class Stage61OrderItemStatus1775650000000 {
    constructor() {
        this.name = 'Stage61OrderItemStatus1775650000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_item_status_enum') THEN
                    CREATE TYPE "public"."order_item_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'READY', 'DONE', 'FAILED', 'CANCELLED');
                END IF;
            END $$;
        `);
        await queryRunner.query(`
            ALTER TABLE "order_items" 
            ADD "status" "public"."order_item_status_enum" NOT NULL DEFAULT 'PENDING'
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_order_items_status" ON "order_items" ("status")
        `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_order_items_status"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."order_item_status_enum"`);
    }
}
exports.Stage61OrderItemStatus1775650000000 = Stage61OrderItemStatus1775650000000;
//# sourceMappingURL=1775650000000-Stage61OrderItemStatus.js.map