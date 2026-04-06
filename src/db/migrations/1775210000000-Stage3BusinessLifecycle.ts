import { MigrationInterface, QueryRunner } from "typeorm";

export class Stage3BusinessLifecycle1775210000000 implements MigrationInterface {
    name = 'Stage3BusinessLifecycle1775210000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Refactor de Business
        // Renombramos is_available para que sea semánticamente correcto ("Acepta pedidos")
        await queryRunner.query(`ALTER TABLE "businesses" RENAME COLUMN "is_available" TO "accepting_orders"`);
        
        // Añadimos tracking de paso de onboarding
        await queryRunner.query(`ALTER TABLE "businesses" ADD "onboarding_step" character varying DEFAULT 'BASIC_INFO'`);
        
        // 2. Refactor de BusinessTemplate
        // Añadimos flag de habilitación administrativa para templates
        await queryRunner.query(`ALTER TABLE "business_templates" ADD "is_enabled" boolean NOT NULL DEFAULT true`);

        // 3. Ajustamos el default para negocios nuevos (DRAFT)
        // Nota: Los existentes se mantienen en ACTIVE por retro-compatibilidad si ya estaban así
        await queryRunner.query(`ALTER TABLE "businesses" ALTER COLUMN "status" SET DEFAULT 'DRAFT'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "businesses" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'`);
        await queryRunner.query(`ALTER TABLE "business_templates" DROP COLUMN "is_enabled"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "onboarding_step"`);
        await queryRunner.query(`ALTER TABLE "businesses" RENAME COLUMN "accepting_orders" TO "is_available"`);
    }
}
