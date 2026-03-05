import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateOrderSchemaAddDepositAndNotes1772568384320 implements MigrationInterface {
    name = 'UpdateOrderSchemaAddDepositAndNotes1772568384320'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_business_customers"`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD "deposit" numeric(12,2) DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "UQ_3e413c10c595c04c6c70e58a4dc"`);
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "business_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "UQ_8536b8b85c06969f84f0c098b03"`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "UQ_1d481f8d0aeb7d3623c526ed2f0" UNIQUE ("code", "business_id")`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "UQ_b4fca090f9127d1fd4afaede809" UNIQUE ("email", "business_id")`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_c04b1ab3076e753f96c64318286" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_c04b1ab3076e753f96c64318286"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "UQ_b4fca090f9127d1fd4afaede809"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "UQ_1d481f8d0aeb7d3623c526ed2f0"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "UQ_8536b8b85c06969f84f0c098b03" UNIQUE ("email")`);
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "business_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "UQ_3e413c10c595c04c6c70e58a4dc" UNIQUE ("code")`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "deposit"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_business_customers" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
