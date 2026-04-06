"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stage41RBACInitial1775250000000 = void 0;
class Stage41RBACInitial1775250000000 {
    constructor() {
        this.name = 'Stage41RBACInitial1775250000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`UPDATE "business_memberships" SET "role" = 'BUSINESS_ADMIN' WHERE "role" = 'MEMBER'`);
        await queryRunner.query(`UPDATE "business_memberships" SET "role" = 'BUSINESS_ADMIN' WHERE "role" = 'ADMIN'`);
        await queryRunner.query(`UPDATE "employees" SET "role" = 'BUSINESS_ADMIN' WHERE "role" = 'MEMBER'`);
        await queryRunner.query(`UPDATE "employees" SET "role" = 'BUSINESS_ADMIN' WHERE "role" = 'ADMIN'`);
        await queryRunner.query(`UPDATE "business_memberships" SET "role" = 'OPERATOR' WHERE "role" NOT IN ('OWNER', 'BUSINESS_ADMIN', 'SALES', 'OPERATOR', 'VIEWER')`);
    }
    async down(queryRunner) {
        await queryRunner.query(`UPDATE "business_memberships" SET "role" = 'MEMBER' WHERE "role" IN ('BUSINESS_ADMIN', 'SALES', 'OPERATOR', 'VIEWER')`);
        await queryRunner.query(`UPDATE "employees" SET "role" = 'MEMBER' WHERE "role" IN ('BUSINESS_ADMIN', 'SALES', 'OPERATOR', 'VIEWER')`);
    }
}
exports.Stage41RBACInitial1775250000000 = Stage41RBACInitial1775250000000;
//# sourceMappingURL=1775250000000-Stage41RBACInitial.js.map