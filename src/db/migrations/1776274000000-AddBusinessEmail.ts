import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBusinessEmail1776274000000 implements MigrationInterface {
    name = 'AddBusinessEmail1776274000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "businesses" ADD "email" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "email"`);
    }
}
