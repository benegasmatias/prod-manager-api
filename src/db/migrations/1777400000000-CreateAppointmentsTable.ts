import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAppointmentsTable1777400000000 implements MigrationInterface {
    name = 'CreateAppointmentsTable1777400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum type
        await queryRunner.query(`CREATE TYPE "public"."appointments_status_enum" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'DONE')`);

        // Create table
        await queryRunner.query(`
            CREATE TABLE "appointments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "business_id" uuid NOT NULL,
                "customer_id" uuid,
                "vehicle_id" uuid,
                "employee_id" uuid,
                "subject" character varying NOT NULL,
                "description" text,
                "start" TIMESTAMP NOT NULL,
                "end" TIMESTAMP,
                "status" "public"."appointments_status_enum" NOT NULL DEFAULT 'PENDING',
                "type" character varying,
                "metadata" jsonb,
                "converted_order_id" uuid,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_appointments_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_appointments_business" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_appointments_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL,
                CONSTRAINT "FK_appointments_vehicle" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL,
                CONSTRAINT "FK_appointments_employee" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL
            )
        `);

        // Create indexes
        await queryRunner.query(`CREATE INDEX "IDX_appointments_business_id" ON "appointments" ("business_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_appointments_customer_id" ON "appointments" ("customer_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_appointments_start" ON "appointments" ("start")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_appointments_start"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_appointments_customer_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_appointments_business_id"`);
        await queryRunner.query(`DROP TABLE "appointments"`);
        await queryRunner.query(`DROP TYPE "public"."appointments_status_enum"`);
    }

}
