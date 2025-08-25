const AppDataSource = require("../data-source");
const Location = require("../entities/Location");
const Farmer = require("../entities/Farmer");
const Farm = require("../entities/Farm");

// Abia LGA Mapping: KoboToolbox values → Location table names
const getAbiaLGAMapping = () => {
  return {
    'aba_north': 'Aba North',
    'aba_south': 'Aba South',
    'arochukwu': 'Arochukwu',
    'bende': 'Bende',
    'ikwuano': 'Ikwuano',
    'isiala_ngwa_north': 'Isiala-Ngwa North',
    'isiala_ngwa_south': 'Isiala-Ngwa South',
    'isuikwato': 'Isuikwato',
    'obi_nwa': 'Obi Nwa',
    'ohafia': 'Ohafia',
    'umu_neochi': 'Umu-Neochi',
    'osisioma': 'Osisioma',
    'ngwa': 'Ngwa',
    'ugwunagbo': 'Ugwunagbo',
    'ukwa_east': 'Ukwa East',
    'ukwa_west': 'Ukwa West',
    'umuahia_north': 'Umuahia North',
    'umuahia_south': 'Umuahia South'
  };
};

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

// FIXED: Abia State Summary
// FIXED: Abia State Summary
const getAbiaStateSummary = async (req, res) => {
  const locationRepository = AppDataSource.getRepository(Location);
  const farmerRepository = AppDataSource.getRepository(Farmer);
  const farmRepository = AppDataSource.getRepository(Farm);

  try {
    // Get Abia state geometry
    const abiaState = await locationRepository
      .createQueryBuilder("l")
      .select("st_asgeojson(l.geom) AS geom")
      .where("l.name = :name AND l.type = :type", { 
        name: 'Abia', 
        type: 'State' 
      })
      .getRawOne();

    // Count farmers in Abia state
    const farmerCount = await farmerRepository
      .createQueryBuilder("f")
      .where("LOWER(f.state) = :state", { state: 'abia' })
      .getCount();

    // Count farms for farmers in Abia state
    const farmCount = await farmRepository
      .createQueryBuilder("farm")
      .innerJoin("farmer", "farmer", "farm.farmer_id::text = farmer.farmer_id::text")
      .where("LOWER(farmer.state) = :state", { state: 'abia' })
      .getCount();

    // Get crop counts and total area for Abia state
    const cropData = await farmRepository
      .createQueryBuilder("farm")
      .select([
        "farm.crop_type AS crop_type",
        "COUNT(farm.id) AS crop_count",
        "SUM(farm.calculated_area) AS total_area"
      ])
      .innerJoin("farmer", "farmer", "farm.farmer_id::text = farmer.farmer_id::text")
      .where("LOWER(farmer.state) = :state AND farm.crop_type IS NOT NULL", { state: 'abia' })
      .groupBy("farm.crop_type")
      .getRawMany();

    // Calculate total area of all farms
    const totalArea = cropData.reduce((sum, crop) => sum + parseFloat(crop.total_area || 0), 0);

    // Format crop data
    const cropsWithCounts = cropData.map(crop => ({
      crop: crop.crop_type,
      count: parseInt(crop.crop_count, 10),
      area: parseFloat(crop.total_area || 0)
    }));

    const response = {
      state_name: "Abia",
      farmers_count: farmerCount,
      farms_count: farmCount,
      crops_by_count: cropsWithCounts,
      total_area_acres: totalArea,
      geom: abiaState ? abiaState.geom : null
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching Abia state summary:", error);
    res.status(500).json({ message: "Error fetching Abia state summary.", error: error.message });
  }
};

// FIXED: Abia LGAs Summary
const getAbiaLGAsSummary = async (req, res) => {
  const locationRepository = AppDataSource.getRepository(Location);
  const farmerRepository = AppDataSource.getRepository(Farmer);
  const farmRepository = AppDataSource.getRepository(Farm);

  try {
    const lgaMapping = getAbiaLGAMapping();
    const koboLGAValues = Object.keys(lgaMapping);
    const locationLGANames = Object.values(lgaMapping);

    // Get LGA geometries from location table
    const lgaGeometries = await locationRepository
      .createQueryBuilder("l")
      .select([
        "l.name AS lga_name",
        "st_asgeojson(l.geom) AS geom"
      ])
      .where("l.type = :type", { type: 'LGA' })
      .andWhere("l.name IN (:...names)", { names: locationLGANames })
      .getRawMany();

    // Create geometry lookup map
    const geomMap = {};
    lgaGeometries.forEach(lga => {
      geomMap[lga.lga_name] = lga.geom;
    });

    const lgaSummaries = [];

    // Process each LGA that has farmers
    for (const koboLGA of koboLGAValues) {
      const locationLGAName = lgaMapping[koboLGA];

      // Count farmers in this LGA
      const farmerCount = await farmerRepository
        .createQueryBuilder("f")
        .where("LOWER(f.state) = :state AND f.lga = :lga", { 
          state: 'abia',
          lga: koboLGA
        })
        .getCount();

      // Skip LGAs with no farmers
      if (farmerCount === 0) continue;

      // Count farms in this LGA
      const farmCount = await farmRepository
        .createQueryBuilder("farm")
        .innerJoin("farmer", "farmer", "farm.farmer_id::text = farmer.farmer_id::text")
        .where("LOWER(farmer.state) = :state AND farmer.lga = :lga", { 
          state: 'abia',
          lga: koboLGA
        })
        .getCount();

      // Get crop data for this LGA
      const cropData = await farmRepository
      .createQueryBuilder("farm")
      .select([
        "farm.crop_type AS crop_type",
        "COUNT(farm.id) AS crop_count",
        "SUM(farm.calculated_area) AS crop_area"
      ])
      .innerJoin("farmer", "farmer", "farm.farmer_id::text = farmer.farmer_id::text")
      .where("LOWER(farmer.state) = :state AND farmer.lga = :lga AND farm.crop_type IS NOT NULL", { 
        state: 'abia',
        lga: koboLGA
      })
      .groupBy("farm.crop_type")
      .getRawMany();

      // Calculate total area for this LGA
      const totalAreaResult = await farmRepository
        .createQueryBuilder("farm")
        .select("SUM(farm.calculated_area) AS total_area")
        .innerJoin("farmer", "farmer", "farm.farmer_id::text = farmer.farmer_id::text")
        .where("LOWER(farmer.state) = :state AND farmer.lga = :lga", { 
          state: 'abia',
          lga: koboLGA
        })
        .getRawOne();

      const cropsWithCounts = cropData.map(crop => ({
  crop: crop.crop_type,
  count: parseInt(crop.crop_count, 10),
  area: parseFloat(crop.crop_area || 0)
}));

      lgaSummaries.push({
        lga_name: locationLGAName,
        farmers_count: farmerCount,
        farms_count: farmCount,
        crops_by_count: cropsWithCounts,
        total_area_acres: parseFloat(totalAreaResult.total_area || 0),
        geom: geomMap[locationLGAName] || null
      });
    }

    if (lgaSummaries.length === 0) {
      return res.status(404).json({ message: "No LGAs found for Abia state with farmer data" });
    }

    res.status(200).json({
      state_name: "Abia",
      lgas_summary: lgaSummaries
    });
  } catch (error) {
    console.error("Error fetching Abia LGAs summary:", error);
    res.status(500).json({ message: "Error fetching Abia LGAs summary.", error: error.message });
  }
};

// NEW: Admin Boundary APIs

// Get Abia State Boundary
const getAbiaStateBoundary = async (req, res) => {
  const locationRepository = AppDataSource.getRepository(Location);

  try {
    const abiaState = await locationRepository
      .createQueryBuilder("l")
      .select([
        "l.name AS name",
        "st_asgeojson(l.geom) AS geom"
      ])
      .where("l.name = :name AND l.type = :type", { 
        name: 'Abia', 
        type: 'State' 
      })
      .getRawOne();

    if (!abiaState) {
      return res.status(404).json({ message: "Abia state boundary not found" });
    }

    res.status(200).json({
      name: abiaState.name,
      type: "State",
      geom: abiaState.geom
    });
  } catch (error) {
    console.error("Error fetching Abia state boundary:", error);
    res.status(500).json({ message: "Error fetching Abia state boundary.", error: error.message });
  }
};

// Get Abia LGAs Boundaries
const getAbiaLGAsBoundaries = async (req, res) => {
  const locationRepository = AppDataSource.getRepository(Location);

  try {
    const abiaLGAs = await locationRepository
      .createQueryBuilder("l")
      .select([
        "l.name AS name", 
        "st_asgeojson(l.geom) AS geom"
      ])
      .innerJoin(
        "location", "s",
        "s.type = 'State' AND s.name = 'Abia' AND ST_Within(l.geom, s.geom)"
      )
      .where("l.type = 'LGA'")
      .getRawMany();

    if (!abiaLGAs.length) {
      return res.status(404).json({ message: "No Abia LGA boundaries found" });
    }

    const boundaries = abiaLGAs.map(lga => ({
      name: lga.name,
      type: "LGA", 
      geom: lga.geom
    }));

    res.status(200).json({
      state_name: "Abia",
      total_lgas: boundaries.length,
      lgas: boundaries
    });
  } catch (error) {
    console.error("Error fetching Abia LGAs boundaries:", error);
    res.status(500).json({ message: "Error fetching Abia LGAs boundaries.", error: error.message });
  }
};

// Get Abia State Farmers Locations for Map Clustering
const getAbiaFarmersLocations = async (req, res) => {
  const farmerRepository = AppDataSource.getRepository(Farmer);

  try {
    const farmers = await farmerRepository
      .createQueryBuilder("f")
      .select([
        "f.farmer_id AS farmer_id",
        "f.user_latitude AS latitude", 
        "f.user_longitude AS longitude"
      ])
      .where("LOWER(f.state) = :state", { state: 'abia' })
      .andWhere("f.user_latitude IS NOT NULL AND f.user_longitude IS NOT NULL")
      .getRawMany();

    const response = {
      state_name: "Abia",
      total_count: farmers.length,
      farmers: farmers.map(farmer => ({
        farmer_id: farmer.farmer_id,
        latitude: parseFloat(farmer.latitude),
        longitude: parseFloat(farmer.longitude)
      }))
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching Abia farmers locations:", error);
    res.status(500).json({ message: "Error fetching Abia farmers locations.", error: error.message });
  }
};

// Get Abia State Farms Locations for Map Clustering
const getAbiaFarmsLocations = async (req, res) => {
  const farmRepository = AppDataSource.getRepository(Farm);

  try {
    const farms = await farmRepository
      .createQueryBuilder("farm")
      .select([
        "farm.id AS farm_id",
        "ST_Y(ST_Centroid(farm.geom)) AS centroid_latitude",
        "ST_X(ST_Centroid(farm.geom)) AS centroid_longitude", 
        "ST_AsText(farm.geom) AS geom"
      ])
      .innerJoin("farmer", "farmer", "farm.farmer_id::text = farmer.farmer_id::text")
      .where("LOWER(farmer.state) = :state", { state: 'abia' })
      .andWhere("farm.geom IS NOT NULL")
      .getRawMany();

    const response = {
      state_name: "Abia",
      total_count: farms.length,
      farms: farms.map(farm => ({
        farm_id: farm.farm_id,
        centroid_latitude: parseFloat(farm.centroid_latitude),
        centroid_longitude: parseFloat(farm.centroid_longitude),
        geom: farm.geom
      }))
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching Abia farms locations:", error);
    res.status(500).json({ message: "Error fetching Abia farms locations.", error: error.message });
  }
};

module.exports = { 
  getFarmersCountByLocation, 
  getCropsByLocation,
  getAbiaStateSummary,
  getAbiaLGAsSummary,
  getAbiaStateBoundary,
  getAbiaLGAsBoundaries,
  getAbiaFarmersLocations,
  getAbiaFarmsLocations
};