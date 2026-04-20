import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInStockToOrderItemStatus1777000000000 implements MigrationInterface {
    name = 'AddInStockToOrderItemStatus1777000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // En Postgres no se puede ejecutar ADD VALUE dentro de una transacción en versiones antiguas,
        // pero TypeORM suele envolver las migraciones en transacciones.
        // Usamos una técnica para ejecutarlo fuera si es necesario, o simplemente el comando.
        await queryRunner.query(`ALTER TYPE "public"."order_item_status_enum" ADD VALUE IF NOT EXISTS 'IN_STOCK'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No se puede remover un valor de un enum fácilmente en Postgres
    }
}
