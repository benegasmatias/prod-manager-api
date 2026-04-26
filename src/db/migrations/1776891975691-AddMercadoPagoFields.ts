import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMercadoPagoFields1776891975691 implements MigrationInterface {
    name = 'AddMercadoPagoFields1776891975691'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "business_subscriptions" ADD "external_payment_id" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "business_subscriptions" ADD "last_payment_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "business_subscriptions" ADD "payment_method" character varying(50)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum_old" AS ENUM('APPROVED', 'ARMADO', 'ASSEMBLY', 'BARNIZADO', 'BUDGET_GENERATED', 'BUDGET_REJECTED', 'CANCELLED', 'CONFIRMED', 'CUTTING', 'DELIVERED', 'DESIGN', 'DONE', 'DRAFT', 'FAILED', 'INSTALACION_OBRA', 'IN_PROGRESS', 'IN_STOCK', 'OFFICIAL_ORDER', 'PAINTING', 'PENDING', 'POST_PROCESS', 'QUOTATION', 'READY', 'REPRINT_PENDING', 'RE_WORK', 'SITE_VISIT', 'SITE_VISIT_DONE', 'SURVEY_DESIGN', 'VISITA_CANCELADA', 'VISITA_REPROGRAMADA', 'WELDING')`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "status" TYPE "public"."orders_status_enum_old" USING "status"::"text"::"public"."orders_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."orders_status_enum_old" RENAME TO "orders_status_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."order_items_status_enum_old" AS ENUM('CANCELLED', 'DONE', 'FAILED', 'IN_PROGRESS', 'IN_STOCK', 'PENDING', 'READY')`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "status" TYPE "public"."order_items_status_enum_old" USING "status"::"text"::"public"."order_items_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."order_items_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."order_items_status_enum_old" RENAME TO "order_items_status_enum"`);
        await queryRunner.query(`ALTER TABLE "business_subscriptions" DROP COLUMN "payment_method"`);
        await queryRunner.query(`ALTER TABLE "business_subscriptions" DROP COLUMN "last_payment_at"`);
        await queryRunner.query(`ALTER TABLE "business_subscriptions" DROP COLUMN "external_payment_id"`);
    }

}
