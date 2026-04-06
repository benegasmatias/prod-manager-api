"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stage32Traceability1775230000000 = void 0;
class Stage32Traceability1775230000000 {
    constructor() {
        this.name = 'Stage32Traceability1775230000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "businesses" ADD "status_updated_at" TIMESTAMP DEFAULT now()`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "status_updated_at"`);
    }
}
exports.Stage32Traceability1775230000000 = Stage32Traceability1775230000000;
//# sourceMappingURL=1775230000000-Stage32Traceability.js.map