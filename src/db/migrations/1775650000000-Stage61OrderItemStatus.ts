import { MigrationInterface, QueryRunner } from "typeorm";

export class Stage61OrderItemStatus1775650000000 implements MigrationInterface {
    name = 'Stage61OrderItemStatus1775650000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Crear el tipo enum si no existe
        await queryRunner.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_item_status_enum') THEN
                    CREATE TYPE "public"."order_item_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'READY', 'DONE', 'FAILED', 'CANCELLED');
                END IF;
            END $$;
        `);

        // 2. Agregar columna status a order_items
        await queryRunner.query(`
            ALTER TABLE "order_items" 
            ADD "status" "public"."order_item_status_enum" NOT NULL DEFAULT 'PENDING'
        `);

        // 3. Crear índice para performance en tableros
        await queryRunner.query(`
            CREATE INDEX "IDX_order_items_status" ON "order_items" ("status")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_order_items_status"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."order_item_status_enum"`);
    }

}
