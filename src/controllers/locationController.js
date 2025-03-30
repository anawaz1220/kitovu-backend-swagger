const AppDataSource = require("../data-source");
const Location = require("../entities/Location");
const Farmer = require("../entities/Farmer");
const Farm = require("../entities/Farm");


const getFarmersCountByLocation = async (req, res) => {
  const locationRepository = AppDataSource.getRepository(Location);
  const { type, name } = req.query;

  try {
    // Build the query using TypeORM's query builder
    const query = locationRepository
      .createQueryBuilder("l")
      .select([
        "l.name AS name",
        "st_asgeojson(l.geom) AS geom",
        "COUNT(f.id) AS farmer_count", // Count farmers
      ])
      .leftJoin(
        Farmer,
        "f",
        "ST_Intersects(l.geom, ST_SetSRID(ST_MakePoint(f.user_longitude, f.user_latitude), 4326))"
      )
      .groupBy("l.name, l.geom");

    // Apply filters
    if (type) {
      query.andWhere("l.type = :type", { type });
    }
    if (name) {
      query.andWhere("l.name ILIKE :name", { name: `%${name}%` });
    }

    // Execute the query
    const results = await query.getRawMany();

    // Format the response
    const response = results.map((row) => ({
      name: row.name,
      farmer_count: parseInt(row.farmer_count, 10), // Convert to integer
      geom: row.geom, // Optional: Include geometry if needed
    }));

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching farmers count by location:", error);
    res.status(500).json({ message: "Error fetching farmers count by location.", error: error.message });
  }
};


const getCropsByLocation = async (req, res) => {
    const locationRepository = AppDataSource.getRepository(Location);
    const { type, crop, name } = req.query;
  
    try {
      // Build the query using TypeORM's query builder
      const query = locationRepository
        .createQueryBuilder("l")
        .select([
          "l.name AS name",
          "st_asgeojson(l.geom) AS geom",
          "COUNT(f.id) AS farms_count", // Count farmers
          "sum(f.calculated_area) as crop_area"
        ])
        .leftJoin(
          Farm,
          "f",
          "ST_Intersects(l.geom, f.geom)"
        )
        .groupBy("l.name, l.geom");
  
      // Apply filters
      if (type) {
        query.andWhere("l.type = :type", { type });
      }
      if (crop) {
        query.andWhere("f.crop_type ILIKE :crop", { crop: `%${crop}%` });
      }
      // Add name filter to match the functionality in getFarmersCountByLocation
      if (name) {
        query.andWhere("l.name ILIKE :name", { name: `%${name}%` });
      }
  
      // Execute the query
      const results = await query.getRawMany();
  
      // Format the response
      const response = results.map((row) => ({
        name: row.name,
        farms_count: parseInt(row.farms_count, 10), // Convert to integer
        crop_area: parseInt(row.crop_area, 10),
        geom: row.geom, // Optional: Include geometry if needed
      }));
  
      res.status(200).json(response);
    } catch (error) {
      console.error("Error fetching crops by location:", error);
      res.status(500).json({ message: "Error fetching crops by location.", error: error.message });
    }
  };

module.exports = { getFarmersCountByLocation, getCropsByLocation };