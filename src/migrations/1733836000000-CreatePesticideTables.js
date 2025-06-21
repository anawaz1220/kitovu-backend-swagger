// src/migrations/1733836000000-CreatePesticideTables.js
const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class CreatePesticideTables1733836000000 {
    name = 'CreatePesticideTables1733836000000';

    async up(queryRunner) {
        // Create pesticides table
        await queryRunner.query(`
            CREATE TABLE "pesticides" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "active_ingredient" character varying(200) NOT NULL,
                "application_time" text NOT NULL,
                "target_pests" text NOT NULL,
                "growth_stage" text,
                "spectrum_of_control" character varying(100),
                "application_method" character varying(100),
                "regions_commonly_used" text,
                "special_notes" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_pesticides" PRIMARY KEY ("id")
            )
        `);

        // Create pesticide_brands table
        await queryRunner.query(`
            CREATE TABLE "pesticide_brands" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "pesticide_id" uuid NOT NULL,
                "brand_name" character varying(100) NOT NULL,
                "concentration" character varying(50) NOT NULL,
                "application_rate" character varying(50) NOT NULL,
                "dilution_rate" character varying(50),
                "safety_period_before_harvest" character varying(50),
                "manufacturer" character varying(200),
                "contraindications" text,
                "is_available" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_pesticide_brands" PRIMARY KEY ("id")
            )
        `);

        // Create pesticide_crops table
        await queryRunner.query(`
            CREATE TABLE "pesticide_crops" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "pesticide_id" uuid NOT NULL,
                "crop_type" character varying(50) NOT NULL,
                "is_primary_crop" boolean NOT NULL DEFAULT false,
                "special_instructions" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_pesticide_crops" PRIMARY KEY ("id")
            )
        `);

        // Create pesticide_targets table (for specific pest targeting)
        await queryRunner.query(`
            CREATE TABLE "pesticide_targets" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "pesticide_id" uuid NOT NULL,
                "target_type" character varying(50) NOT NULL, -- 'pest' or 'disease'
                "target_name" character varying(100) NOT NULL,
                "severity_level" character varying(20), -- 'high', 'medium', 'low'
                "efficacy_rating" integer DEFAULT 5, -- 1-10 scale
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_pesticide_targets" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "pesticide_brands" 
            ADD CONSTRAINT "FK_pesticide_brands_pesticide_id" 
            FOREIGN KEY ("pesticide_id") REFERENCES "pesticides"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "pesticide_crops" 
            ADD CONSTRAINT "FK_pesticide_crops_pesticide_id" 
            FOREIGN KEY ("pesticide_id") REFERENCES "pesticides"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "pesticide_targets" 
            ADD CONSTRAINT "FK_pesticide_targets_pesticide_id" 
            FOREIGN KEY ("pesticide_id") REFERENCES "pesticides"("id") ON DELETE CASCADE
        `);

        // Create indexes for better performance
        await queryRunner.query(`
            CREATE INDEX "IDX_PESTICIDE_CROP" ON "pesticide_crops" ("pesticide_id", "crop_type")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_PESTICIDE_BRAND_AVAILABLE" ON "pesticide_brands" ("pesticide_id", "is_available")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_PESTICIDE_NAME" ON "pesticides" ("name")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_PESTICIDE_TARGET_TYPE" ON "pesticide_targets" ("pesticide_id", "target_type", "target_name")
        `);
    }

    async down(queryRunner) {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_PESTICIDE_TARGET_TYPE"`);
        await queryRunner.query(`DROP INDEX "IDX_PESTICIDE_NAME"`);
        await queryRunner.query(`DROP INDEX "IDX_PESTICIDE_BRAND_AVAILABLE"`);
        await queryRunner.query(`DROP INDEX "IDX_PESTICIDE_CROP"`);

        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "pesticide_targets" DROP CONSTRAINT "FK_pesticide_targets_pesticide_id"`);
        await queryRunner.query(`ALTER TABLE "pesticide_crops" DROP CONSTRAINT "FK_pesticide_crops_pesticide_id"`);
        await queryRunner.query(`ALTER TABLE "pesticide_brands" DROP CONSTRAINT "FK_pesticide_brands_pesticide_id"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "pesticide_targets"`);
        await queryRunner.query(`DROP TABLE "pesticide_crops"`);
        await queryRunner.query(`DROP TABLE "pesticide_brands"`);
        await queryRunner.query(`DROP TABLE "pesticides"`);
    }
};