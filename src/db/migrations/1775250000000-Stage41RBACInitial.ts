import { MigrationInterface, QueryRunner } from "typeorm";

export class Stage41RBACInitial1775250000000 implements MigrationInterface {
    name = 'Stage41RBACInitial1775250000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Actualizar roles en business_memberships (MEMBER -> BUSINESS_ADMIN)
        // Como es un ENUM en Postgres, primero debemos alterar el tipo o convertirlo a texto temporalmente si es necesario.
        // Pero dado que en código ya cambiamos el enum, TypeORM intentará sincronizarlo. 
        // Aquí hacemos la migración de datos lógica sobre la columna 'role'.
        
        // Primero nos aseguramos de que los valores existan en el enum de la DB (o lo tratamos como varchar si hay issues)
        // En esta infraestructura usualmente usamos strings si no es un ENUM nativo estricto de Postgres.
        
        await queryRunner.query(`UPDATE "business_memberships" SET "role" = 'BUSINESS_ADMIN' WHERE "role" = 'MEMBER'`);
        await queryRunner.query(`UPDATE "business_memberships" SET "role" = 'BUSINESS_ADMIN' WHERE "role" = 'ADMIN'`);

        // 2. Actualizar roles en employees (MEMBER -> BUSINESS_ADMIN)
        await queryRunner.query(`UPDATE "employees" SET "role" = 'BUSINESS_ADMIN' WHERE "role" = 'MEMBER'`);
        await queryRunner.query(`UPDATE "employees" SET "role" = 'BUSINESS_ADMIN' WHERE "role" = 'ADMIN'`);
        
        // 3. Fallback: Cualquier rol no reconocido (o nulo) se pone como OPERATOR por seguridad
        await queryRunner.query(`UPDATE "business_memberships" SET "role" = 'OPERATOR' WHERE "role" NOT IN ('OWNER', 'BUSINESS_ADMIN', 'SALES', 'OPERATOR', 'VIEWER')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revertir a MEMBER si es necesario
        await queryRunner.query(`UPDATE "business_memberships" SET "role" = 'MEMBER' WHERE "role" IN ('BUSINESS_ADMIN', 'SALES', 'OPERATOR', 'VIEWER')`);
        await queryRunner.query(`UPDATE "employees" SET "role" = 'MEMBER' WHERE "role" IN ('BUSINESS_ADMIN', 'SALES', 'OPERATOR', 'VIEWER')`);
    }
}
