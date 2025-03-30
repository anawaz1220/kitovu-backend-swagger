const { DataSource } = require("typeorm");
require("dotenv").config();

// Create a DataSource configuration using the ormconfig.json values
const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "postgres",
  database: "kitovu_2",
  synchronize: false, // Set to false for migrations
  logging: false,
  entities: ["src/entities/**/*.js"],
  migrations: ["src/migrations/**/*.js"],
  subscribers: ["src/subscribers/**/*.js"],
});

module.exports = AppDataSource;