const AppDataSource = require("../data-source");
const Farm = require("../entities/Farm");
const Farmer = require("../entities/Farmer");


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
  } = req.body;

  try {
    // Check if the farmer exists using farmer_id field
    const farmer = await farmerRepository.findOne({ where: { farmer_id: farmer_id } });
    if (!farmer) {
      return res.status(404).json({ message: "Farmer does not exist." });
    }

    // Validate GeoJSON
    console.log(typeof draw_farm, 'draw farm type');
    
    // Convert string to object if needed
    let geojson = draw_farm;
    if (typeof draw_farm === "string") {
      try {
        geojson = JSON.parse(draw_farm);
      } catch (e) {
        return res.status(400).json({ message: "Invalid GeoJSON format - parsing error." });
      }
    }

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

    // Create the farm entity
    const farm = farmRepository.create({
      farmer_id,
      Draw_Farm: JSON.stringify(geojson), // Store the GeoJSON as text
      farm_type,
      ownership_status,
      lease_years,
      lease_months,
      calculated_area: calculatedArea,
      crop_type,
      livestock_type,
      number_of_animals,
      farm_latitude,
      farm_longitude,
    });

    // Save the farm entity
    await farmRepository.save(farm);

    res.status(201).json(farm);
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