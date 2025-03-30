const AppDataSource = require("../data-source");

const connectDB = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection error:", error);
  }
};

module.exports = connectDB;