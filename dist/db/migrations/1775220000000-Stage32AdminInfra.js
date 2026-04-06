"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stage32AdminInfra1775220000000 = void 0;
class Stage32AdminInfra1775220000000 {
    constructor() {
        this.name = 'Stage32AdminInfra1775220000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "businesses" ADD "status_reason_code" varchar`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD "status_reason_text" text`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD "plan" varchar DEFAULT 'FREE'`);
        await queryRunner.query(`ALTER TABLE "business_templates" ADD "required_plan" varchar DEFAULT 'FREE'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "plan" varchar DEFAULT 'FREE'`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "plan"`);
        await queryRunner.query(`ALTER TABLE "business_templates" DROP COLUMN "required_plan"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "plan"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "status_reason_text"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "status_reason_code"`);
    }
}
exports.Stage32AdminInfra1775220000000 = Stage32AdminInfra1775220000000;
//# sourceMappingURL=1775220000000-Stage32AdminInfra.js.map