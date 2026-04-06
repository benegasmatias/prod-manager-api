"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtendBusinessWithFlags1775151681005 = void 0;
class ExtendBusinessWithFlags1775151681005 {
    constructor() {
        this.name = 'ExtendBusinessWithFlags1775151681005';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "businesses" ADD "is_enabled" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD "is_available" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD "onboarding_completed" boolean NOT NULL DEFAULT false`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "onboarding_completed"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "is_available"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "is_enabled"`);
    }
}
exports.ExtendBusinessWithFlags1775151681005 = ExtendBusinessWithFlags1775151681005;
//# sourceMappingURL=1775151681005-ExtendBusinessWithFlags.js.map