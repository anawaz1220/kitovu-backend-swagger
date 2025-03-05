const express = require("express");
const connectDB = require("./config/database");
const farmerRoutes = require("./routes/farmerRoutes");
const authRoutes = require("./routes/authRoutes");
const farmRoutes = require("./routes/farmRoutes");
const farmerAffiliationRoutes = require("./routes/farmerAffiliationRoutes"); // Add farmer affiliation routes
const locationRoutes = require("./routes/locationRoutes"); // Add location routes

const swaggerSetup = require("./swagger/swagger");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = 3000;

// Serve static files
app.use("/images", express.static(path.join(__dirname, "../uploads")));
app.use(express.json());

// Routes
app.use("/api", authRoutes);
app.use("/api", farmerRoutes);
app.use("/api", farmRoutes);
app.use("/api", farmerAffiliationRoutes); // Add farmer affiliation routes
app.use("/api", locationRoutes); // Add location routes



// Database connection
connectDB();

// Swagger setup
swaggerSetup(app);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});