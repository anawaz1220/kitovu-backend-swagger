module.exports = class CreateUserTrigger1722078953000 {
    name = 'CreateUserTrigger1722078953000';
  
    async up(queryRunner) {
      // Create a function that will be called by the trigger
      await queryRunner.query(`
        CREATE OR REPLACE FUNCTION create_user_from_farmer_created_by()
        RETURNS TRIGGER AS $$
        BEGIN
          -- Check if created_by is not null and not already in the users table
          IF NEW.created_by IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM users WHERE username = NEW.created_by
          ) THEN
            -- Insert a new user with the created_by value as the username
            -- Use a default password (this is hashed 'KitovuTemp123!')
            INSERT INTO users (id, email, username, password, role, created_at, updated_at)
            VALUES (
              uuid_generate_v4(),
              NEW.created_by || '@kitovu.com.ng', -- Default email based on username
              NEW.created_by,
              '$2a$10$qYPeBtUyIrWYuFCzQsLf8.Ds.ljHrMCL2QrAQQXcM5xHk8kuUPZUi', -- Hashed password for 'KitovuTemp123!'
              'user', -- Default role
              CURRENT_TIMESTAMP,
              CURRENT_TIMESTAMP
            );
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);
  
      // Create trigger on farmer table
      await queryRunner.query(`
        CREATE TRIGGER create_user_from_farmer_trigger
        AFTER INSERT OR UPDATE OF created_by ON farmer
        FOR EACH ROW
        EXECUTE FUNCTION create_user_from_farmer_created_by();
      `);
    }
  
    async down(queryRunner) {
      // Drop trigger and function
      await queryRunner.query(`DROP TRIGGER IF EXISTS create_user_from_farmer_trigger ON farmer;`);
      await queryRunner.query(`DROP FUNCTION IF EXISTS create_user_from_farmer_created_by;`);
    }
  }