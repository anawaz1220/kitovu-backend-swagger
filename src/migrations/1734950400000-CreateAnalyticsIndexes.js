const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class CreateAnalyticsIndexes1734950400000 {
    name = 'CreateAnalyticsIndexes1734950400000';

    async up(queryRunner) {
        // Create farmer location indexes for performance
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_farmer_location" ON "farmer"("state", "lga", "city")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_farmer_coordinates" ON "farmer"("user_latitude", "user_longitude")
        `);

        // Create farm indexes for performance
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_farm_farmer_id" ON "farm"("farmer_id")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_farm_type_crop" ON "farm"("farm_type", "crop_type")
        `);

        // Create spatial index for farm geometries (GIST index for PostGIS)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_farm_geom" ON "farm" USING GIST("geom")
        `);

        // Create composite index for farmer-farm joins
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_farmer_farmer_id" ON "farmer"("farmer_id")
        `);

        // Create index for filtering by farm types efficiently
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_farm_type_only" ON "farm"("farm_type") WHERE "farm_type" IS NOT NULL
        `);

        // Create index for crop types
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_farm_crop_type" ON "farm"("crop_type") WHERE "crop_type" IS NOT NULL
        `);

        // Create composite index for area calculations
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_farm_calculated_area" ON "farm"("calculated_area") WHERE "calculated_area" IS NOT NULL
        `);
    }

    async down(queryRunner) {
        // Drop all the created indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_farm_calculated_area"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_farm_crop_type"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_farm_type_only"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_farmer_farmer_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_farm_geom"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_farm_type_crop"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_farm_farmer_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_farmer_coordinates"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_farmer_location"`);
    }
};