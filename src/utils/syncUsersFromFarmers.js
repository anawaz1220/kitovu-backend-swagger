const { getRepository } = require("typeorm");
const bcrypt = require("bcryptjs");
const AppDataSource = require("../data-source");
const Farmer = require("../entities/Farmer");
const User = require("../entities/User");

/**
 * Synchronizes users from existing farmer records
 * Creates user accounts for any created_by values that don't have corresponding user accounts
 */
async function syncUsersFromFarmers() {
  try {
    // Initialize the data source
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    console.log("Database connected successfully");
    
    const farmerRepository = AppDataSource.getRepository(Farmer);
    const userRepository = AppDataSource.getRepository(User);
    
    // Get distinct created_by values from farmer table
    const creators = await farmerRepository
      .createQueryBuilder("farmer")
      .select("DISTINCT farmer.created_by", "created_by")
      .where("farmer.created_by IS NOT NULL")
      .getRawMany();
    
    console.log(`Found ${creators.length} distinct creator names`);
    
    let created = 0;
    
    // Generate a default password hash
    const defaultPassword = "KitovuTemp123!"; // Default password
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    // Process each creator name
    for (const creator of creators) {
      const username = creator.created_by;
      
      // Skip if empty
      if (!username || username.trim() === "") continue;
      
      // Check if user already exists
      const existingUser = await userRepository.findOne({ where: { username } });
      if (existingUser) {
        console.log(`User already exists for ${username}`);
        continue;
      }
      
      // Create a new user
      const email = `${username}@kitovu.com.ng`;
      
      const newUser = userRepository.create({
        email,
        username,
        password: hashedPassword,
        role: 'user'
      });
      
      await userRepository.save(newUser);
      created++;
      
      console.log(`Created user account for ${username}`);
    }
    
    console.log(`Created ${created} new user accounts`);
    await AppDataSource.destroy();
    
  } catch (error) {
    console.error("Error syncing users from farmers:", error);
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  syncUsersFromFarmers()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
} else {
  // Export for use in other modules
  module.exports = syncUsersFromFarmers;
}