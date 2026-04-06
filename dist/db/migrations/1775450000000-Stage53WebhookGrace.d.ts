import { MigrationInterface, QueryRunner } from "typeorm";
export declare class Stage53WebhookGrace1775450000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
