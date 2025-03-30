const AppDataSource = require("../data-source");
const Location = require("../entities/Location");
const Farmer = require("../entities/Farmer");
const Farm = require("../entities/Farm");


const getFarmersCountByLocation = async (req, res) => {
  const locationRepository = AppDataSource.getRepository(Location);
  const farmerRepository = AppDataSource.getRepository(Farmer);
  const { type, name } = req.query;

  try {
    // Special case for Community (street_address) based filtering
    if (type && type.toLowerCase() === 'community') {
      // Use the farmer repository to group by street_address
      const query = farmerRepository
        .createQueryBuilder("f")
        .select([
          "f.street_address AS name",
          "COUNT(f.id) AS farmer_count"
        ])
        .groupBy("f.street_address");

      // Filter by name if provided
      if (name) {
        query.andWhere("f.street_address ILIKE :name", { name: `%${name}%` });
      }

      const results = await query.getRawMany();

      // Format the response - note that geom will be null for Community
      const response = results.map((row) => ({
        name: row.name,
        farmer_count: parseInt(row.farmer_count, 10),
        geom: null // No geometry data for Community (street_address)
      }));

      return res.status(200).json(response);
    }

    // Regular location-based query (existing functionality)
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
    const farmRepository = AppDataSource.getRepository(Farm);
    const { type, crop, name } = req.query;
  
    try {
      // Special case for Community (street_address) based filtering
      if (type && type.toLowerCase() === 'community') {
        // Get the farmers first with street_address
        const query = farmRepository
          .createQueryBuilder("farm")
          .select([
            "farmer.street_address AS name",
            "COUNT(DISTINCT farm.id) AS farms_count",
            "SUM(farm.calculated_area) AS crop_area"
          ])
          .innerJoin(
            "farmer", // Use the table name instead of the entity
            "farmer",
            "farm.farmer_id::text = farmer.farmer_id::text" // Cast both sides to text to ensure proper comparison
          )
          .groupBy("farmer.street_address");
  
        // Filter by crop type if provided
        if (crop) {
          query.andWhere("farm.crop_type ILIKE :crop", { crop: `%${crop}%` });
        }
  
        // Filter by street_address name if provided
        if (name) {
          query.andWhere("farmer.street_address ILIKE :name", { name: `%${name}%` });
        }
  
        const results = await query.getRawMany();
  
        // Format the response
        const response = results.map((row) => ({
          name: row.name,
          farms_count: parseInt(row.farms_count, 10) || 0,
          crop_area: parseFloat(row.crop_area) || 0,
          geom: null // No geometry data for Community (street_address)
        }));
  
        return res.status(200).json(response);
      }
  
      // Regular location-based query (existing functionality)
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
      if (name) {
        query.andWhere("l.name ILIKE :name", { name: `%${name}%` });
      }
  
      // Execute the query
      const results = await query.getRawMany();
  
      // Format the response
      const response = results.map((row) => ({
        name: row.name,
        farms_count: parseInt(row.farms_count, 10) || 0, // Convert to integer
        crop_area: parseFloat(row.crop_area) || 0,
        geom: row.geom, // Optional: Include geometry if needed
      }));
  
      res.status(200).json(response);
    } catch (error) {
      console.error("Error fetching crops by location:", error);
      res.status(500).json({ message: "Error fetching crops by location.", error: error.message });
    }
  };

module.exports = { getFarmersCountByLocation, getCropsByLocation };