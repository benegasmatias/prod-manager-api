import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBusinessIdToCustomers1772546000000 implements MigrationInterface {
    name = 'AddBusinessIdToCustomers1772546000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" ADD "business_id" uuid`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_business_customers" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_business_customers"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "business_id"`);
    }

}
