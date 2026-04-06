"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaaSInfrastructure1775152378479 = void 0;
class SaaSInfrastructure1775152378479 {
    constructor() {
        this.name = 'SaaSInfrastructure1775152378479';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "business_templates" ADD "config" jsonb`);
        await queryRunner.query(`ALTER TABLE "business_templates" ADD "is_available" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "business_templates" ADD "is_coming_soon" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD "capabilities_override" jsonb`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "capabilities_override"`);
        await queryRunner.query(`ALTER TABLE "business_templates" DROP COLUMN "is_coming_soon"`);
        await queryRunner.query(`ALTER TABLE "business_templates" DROP COLUMN "is_available"`);
        await queryRunner.query(`ALTER TABLE "business_templates" DROP COLUMN "config"`);
    }
}
exports.SaaSInfrastructure1775152378479 = SaaSInfrastructure1775152378479;
//# sourceMappingURL=1775152378479-SaaSInfrastructure.js.map