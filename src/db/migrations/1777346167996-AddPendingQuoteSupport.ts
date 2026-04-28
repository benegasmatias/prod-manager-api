import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPendingQuoteSupport1777346167996 implements MigrationInterface {
    name = 'AddPendingQuoteSupport1777346167996'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Nueva columna de control
        await queryRunner.query(`ALTER TABLE "order_items" ADD "is_pending_quote" boolean NOT NULL DEFAULT false`);
        
        // 2. Hacer campos técnicos y financieros nulos en order_items
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "estimated_minutes" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "estimated_minutes" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "weight_grams" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "weight_grams" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "price" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "price" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "unit_price" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "unit_price" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "subtotal" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "subtotal" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "estimated_unit_cost" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "estimated_unit_cost" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "estimated_sale_unit_price" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "estimated_sale_unit_price" DROP DEFAULT`);
        
        // 3. Hacer total_price nulo en la orden
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "total_price" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "total_price" DROP DEFAULT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Reversión de nulidad en orders
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "total_price" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "total_price" SET NOT NULL`);
        
        // Reversión de nulidad en order_items
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "estimated_sale_unit_price" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "estimated_sale_unit_price" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "estimated_unit_cost" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "estimated_unit_cost" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "subtotal" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "subtotal" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "unit_price" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "unit_price" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "price" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "price" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "weight_grams" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "weight_grams" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "estimated_minutes" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "estimated_minutes" SET NOT NULL`);
        
        // Eliminar columna de control
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "is_pending_quote"`);
    }
}
