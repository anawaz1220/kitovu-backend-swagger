module.exports = class EnableUuidExtension1722078952000 {
    name = 'EnableUuidExtension1722078952000';
  
    async up(queryRunner) {
      // Enable UUID extension if not already enabled
      await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    }
  
    async down(queryRunner) {
      // This is commented out because dropping the extension might affect other tables
      // await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
    }
  }