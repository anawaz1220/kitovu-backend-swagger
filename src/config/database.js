const { createConnection } = require("typeorm");

const connectDB = async () => {
  try {
    await createConnection();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection error:", error);
  }
};

module.exports = connectDB;