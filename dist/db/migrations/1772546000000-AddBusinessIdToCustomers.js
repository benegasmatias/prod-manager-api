"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddBusinessIdToCustomers1772546000000 = void 0;
class AddBusinessIdToCustomers1772546000000 {
    constructor() {
        this.name = 'AddBusinessIdToCustomers1772546000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "customers" ADD "business_id" uuid`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_business_customers" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_business_customers"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "business_id"`);
    }
}
exports.AddBusinessIdToCustomers1772546000000 = AddBusinessIdToCustomers1772546000000;
//# sourceMappingURL=1772546000000-AddBusinessIdToCustomers.js.map