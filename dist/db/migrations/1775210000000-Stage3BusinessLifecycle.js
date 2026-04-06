"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stage3BusinessLifecycle1775210000000 = void 0;
class Stage3BusinessLifecycle1775210000000 {
    constructor() {
        this.name = 'Stage3BusinessLifecycle1775210000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "businesses" RENAME COLUMN "is_available" TO "accepting_orders"`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD "onboarding_step" character varying DEFAULT 'BASIC_INFO'`);
        await queryRunner.query(`ALTER TABLE "business_templates" ADD "is_enabled" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "businesses" ALTER COLUMN "status" SET DEFAULT 'DRAFT'`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "businesses" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'`);
        await queryRunner.query(`ALTER TABLE "business_templates" DROP COLUMN "is_enabled"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "onboarding_step"`);
        await queryRunner.query(`ALTER TABLE "businesses" RENAME COLUMN "accepting_orders" TO "is_available"`);
    }
}
exports.Stage3BusinessLifecycle1775210000000 = Stage3BusinessLifecycle1775210000000;
//# sourceMappingURL=1775210000000-Stage3BusinessLifecycle.js.map