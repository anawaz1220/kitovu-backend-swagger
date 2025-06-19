// src/migrations/1733835600000-CreateHerbicideTables.js
const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class CreateHerbicideTables1733835600000 {
    name = 'CreateHerbicideTables1733835600000';

    async up(queryRunner) {
        // Create herbicides table
        await queryRunner.query(`
            CREATE TABLE "herbicides" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "active_ingredient" character varying(200) NOT NULL,
                "application_time" text NOT NULL,
                "target_weeds" text NOT NULL,
                "growth_stage" text,
                "mode_of_action" character varying(100),
                "spectrum" text,
                "application_method" character varying(100),
                "special_notes" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_herbicides" PRIMARY KEY ("id")
            )
        `);

        // Create herbicide_brands table
        await queryRunner.query(`
            CREATE TABLE "herbicide_brands" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "herbicide_id" uuid NOT NULL,
                "brand_name" character varying(100) NOT NULL,
                "concentration" character varying(50) NOT NULL,
                "application_rate" character varying(50) NOT NULL,
                "dilution_rate" character varying(50),
                "safety_period" character varying(50),
                "manufacturer" character varying(200),
                "contraindications" text,
                "is_available" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_herbicide_brands" PRIMARY KEY ("id")
            )
        `);

        // Create herbicide_crops table
        await queryRunner.query(`
            CREATE TABLE "herbicide_crops" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "herbicide_id" uuid NOT NULL,
                "crop_type" character varying(50) NOT NULL,
                "is_primary_crop" boolean NOT NULL DEFAULT false,
                "special_instructions" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_herbicide_crops" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "herbicide_brands" 
            ADD CONSTRAINT "FK_herbicide_brands_herbicide_id" 
            FOREIGN KEY ("herbicide_id") REFERENCES "herbicides"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "herbicide_crops" 
            ADD CONSTRAINT "FK_herbicide_crops_herbicide_id" 
            FOREIGN KEY ("herbicide_id") REFERENCES "herbicides"("id") ON DELETE CASCADE
        `);

        // Create indexes for better performance
        await queryRunner.query(`
            CREATE INDEX "IDX_HERBICIDE_CROP" ON "herbicide_crops" ("herbicide_id", "crop_type")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_HERBICIDE_BRAND_AVAILABLE" ON "herbicide_brands" ("herbicide_id", "is_available")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_HERBICIDE_NAME" ON "herbicides" ("name")
        `);
    }

    async down(queryRunner) {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_HERBICIDE_NAME"`);
        await queryRunner.query(`DROP INDEX "IDX_HERBICIDE_BRAND_AVAILABLE"`);
        await queryRunner.query(`DROP INDEX "IDX_HERBICIDE_CROP"`);

        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "herbicide_crops" DROP CONSTRAINT "FK_herbicide_crops_herbicide_id"`);
        await queryRunner.query(`ALTER TABLE "herbicide_brands" DROP CONSTRAINT "FK_herbicide_brands_herbicide_id"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "herbicide_crops"`);
        await queryRunner.query(`DROP TABLE "herbicide_brands"`);
        await queryRunner.query(`DROP TABLE "herbicides"`);
    }
};