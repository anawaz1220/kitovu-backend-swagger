// Update to farmController.js
const AppDataSource = require("../data-source");
const Farm = require("../entities/Farm");
const Farmer = require("../entities/Farmer");

// Update to farmController.js - createFarm method
const createFarm = async (req, res) => {
  const farmRepository = AppDataSource.getRepository(Farm);
  const farmerRepository = AppDataSource.getRepository(Farmer);
  const {
    farmer_id,
    draw_farm,
    farm_type,
    ownership_status,
    lease_years,
    lease_months,
    crop_type,
    livestock_type,
    number_of_animals,
    farm_latitude,
    farm_longitude,
    // New fields
    distance_to_farm_km,
    crop_yield,
    livestock_yield,
  } = req.body;

  try {
    // Check if the farmer exists
    const farmer = await farmerRepository.findOne({ where: { farmer_id: farmer_id } });
    if (!farmer) {
      return res.status(404).json({ message: "Farmer does not exist." });
    }

    // Validate GeoJSON
    console.log( typeof draw_farm, 'draw farm type');
    
    // if (!draw_farm || typeof draw_farm !== "string") {
    //   return res.status(400).json({ message: "Invalid or missing GeoJSON data." });
    // }

    // Parse GeoJSON and calculate area
    const geojson = draw_farm;
    if (
      !geojson.type ||
      !geojson.features ||
      !Array.isArray(geojson.features) ||
      geojson.features.length === 0
    ) {
      return res.status(400).json({ message: "Invalid GeoJSON format." });
    }

    // Calculate area in acres
    const areaInSquareMeters = calculateArea(geojson);
    const calculatedArea = areaInSquareMeters / 4046.86; // Convert to acres

    // Create the farm entity with proper type conversion for new fields
    const farm = farmRepository.create({
      farmer_id,
      Draw_Farm: geojson,
      farm_type,
      ownership_status,
      lease_years: lease_years ? parseInt(lease_years) : null,
      lease_months: lease_months ? parseInt(lease_months) : null,
      calculated_area: calculatedArea,
      crop_type,
      livestock_type,
      number_of_animals: number_of_animals ? parseInt(number_of_animals) : null,
      farm_latitude: farm_latitude ? parseFloat(farm_latitude) : null,
      farm_longitude: farm_longitude ? parseFloat(farm_longitude) : null,
      // New fields with proper type conversion
      distance_to_farm_km: distance_to_farm_km ? parseFloat(distance_to_farm_km) : null,
      crop_yield: crop_yield ? parseFloat(crop_yield) : null,
      livestock_yield: livestock_yield ? parseFloat(livestock_yield) : null,
    });

    // Save the farm entity
    await farmRepository.save(farm);

    res.status(201).json(farm); // Return the inserted farm
  } catch (error) {
    console.error("Error creating farm:", error);
    res.status(500).json({ message: "Error creating farm.", error: error.message });
  }
};

// Helper function to calculate area from GeoJSON
const calculateArea = (geojson) => {
  // Implement area calculation logic here
  // For example, use a library like `turf` to calculate the area
  const turf = require("@turf/turf");
  const area = turf.area(geojson); // Area in square meters
  return area;
};

const getFarms = async (req, res) => {
  const farmRepository = AppDataSource.getRepository(Farm);
  const { farm_id, farmer_id, crop_type } = req.query;

  try {
    const filters = {};
    if (farm_id) filters.id = farm_id;
    if (farmer_id) filters.farmer_id = farmer_id;
    if (crop_type) filters.crop_type = crop_type;

    const farms = await farmRepository.find({ where: filters });
    if (!farms.length) {
      return res.status(404).json({ message: "No farms found" });
    }
    res.json(farms);
  } catch (error) {
    res.status(500).json({ message: "Error fetching farms", error });
  }
};

module.exports = { createFarm, getFarms };