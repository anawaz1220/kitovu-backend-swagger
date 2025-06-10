const AppDataSource = require("../data-source");
const Farm = require("../entities/Farm");
const { extractCoordinates, verifyEnvironmentVariables } = require("../services/satelliteService");
const { 
  getNDVIAnalysis, 
  calculateHealthIndex, 
  getOverallStatus, 
  generateAlerts, 
  generateRecommendations,
  getMockNdviAnalysis,
  calculateGrowthStage
} = require("../services/cropHealthService");
const {
  getISDASoilData,
  calculateFertilizerRequirements,
  calculateApplicationSchedule,
  generateCommercialProducts,
  getMockSoilAnalysis,
  getEnhancedFertilizerRecommendations  
} = require("../services/fertilizerService");
const { classifyNutrientStatus } = require("../utils/soilClassification");

// Import new water stress services
const { 
  getNDWIAnalysis, 
  getOverallStressLevel, 
  getMockNDWIAnalysis 
} = require("../services/waterStressService");
const { 
  getWeatherData, 
  getMockWeatherData, 
  verifyWeatherConfig 
} = require("../services/weatherService");
const { 
  generateIrrigationRecommendations, 
  getMockIrrigationRecommendations 
} = require("../services/irrigationService");

// Verify environment variables on startup
if (!verifyEnvironmentVariables()) {
  console.error("Application cannot start due to missing environment variables");
  process.exit(1);
}

/**
 * Get water stress analysis for a farm
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getWaterStress = async (req, res) => {
  try {
    const farmId = req.params.farm_id;
    console.log(`Processing water stress request for farm ID: ${farmId}`);
    
    const farmRepository = AppDataSource.getRepository(Farm);

    // Get farm data
    console.log("Fetching farm data from database...");
    const farm = await farmRepository.findOne({ 
      where: { id: farmId },
      select: ["id", "farmer_id", "farm_id", "Draw_Farm", "farm_type", 
               "crop_type", "calculated_area", "farm_latitude", "farm_longitude", "geom"] 
    });
    
    if (!farm) {
      console.log(`Farm with ID ${farmId} not found`);
      return res.status(404).json({ message: "Farm not found" });
    }
    
    console.log(`Farm found: ${farm.id}, crop type: ${farm.crop_type || 'Unknown'}`);

    // Calculate growth stage based on crop type
    const growthStage = calculateGrowthStage(farm.crop_type);
    console.log(`Calculated growth stage: ${growthStage}`);

    // Set up date range for satellite imagery (last 30 days) 
    // Fix for future dates by using proper current date
    const endDate = new Date("2025-01-26").toISOString(); // Use fixed current date
    const startDate = new Date("2025-01-26");
    startDate.setDate(startDate.getDate() - 30);
    
    console.log(`Date range: ${startDate.toISOString()} to ${endDate}`);
    
    // Extract coordinates for analysis
    const coordinates = extractCoordinates(null, farm);
    const centerLat = coordinates.length > 0 ? coordinates[0][1] : farm.farm_latitude;
    const centerLng = coordinates.length > 0 ? coordinates[0][0] : farm.farm_longitude;
    
    console.log(`Using coordinates for analysis: ${centerLat}, ${centerLng}`);

    try {
      console.log("Starting water stress analysis...");
      
      // Get NDWI analysis and weather data in parallel
      const [ndwiAnalysis, weatherData] = await Promise.all([
        getNDWIAnalysis(
          farm.calculated_area || 1,
          coordinates,
          startDate.toISOString(),
          endDate,
          farm.crop_type
        ),
        getWeatherData(centerLat, centerLng)
      ]);
      
      // Determine overall stress level
      const overallStressLevel = getOverallStressLevel(ndwiAnalysis.average_ndwi);
      
      // Generate irrigation recommendations
      const recommendations = generateIrrigationRecommendations(
        ndwiAnalysis,
        weatherData,
        farm.crop_type,
        growthStage
      );

      console.log(`Water stress analysis complete: Overall stress level: ${overallStressLevel}`);

      // Format and send response
      const response = {
        farm_id: farmId,
        analysis_date: new Date().toISOString(),
        crop: farm.crop_type || "Unknown",
        farm_size_acres: parseFloat((parseFloat(farm.calculated_area) || 0).toFixed(2)),
        farm_size_hectares: parseFloat(((parseFloat(farm.calculated_area) || 0) * 0.404686).toFixed(2)),
        overall_stress_level: overallStressLevel,
        ndwi_analysis: ndwiAnalysis,
        weather_data: weatherData,
        recommendations
      };

      res.json(response);

    } catch (error) {
      console.error("Error in water stress analysis:", error);
      console.log("Falling back to mock data");
      
      // Check if it's a weather API specific error
      let weatherError = null;
      if (error.message && error.message.includes("OpenWeatherMap")) {
        weatherError = error.message;
      }
      
      // Use mock data as fallback
      const mockNdwiData = getMockNDWIAnalysis(farm.calculated_area || 1);
      const mockWeatherData = getMockWeatherData();
      const mockRecommendations = getMockIrrigationRecommendations();
      const overallStressLevel = getOverallStressLevel(mockNdwiData.average_ndwi);
      
      const response = {
        farm_id: farmId,
        analysis_date: new Date().toISOString(),
        crop: farm.crop_type || "Unknown",
        farm_size_acres: parseFloat((parseFloat(farm.calculated_area) || 0).toFixed(2)),
        farm_size_hectares: parseFloat(((parseFloat(farm.calculated_area) || 0) * 0.404686).toFixed(2)),
        overall_stress_level: overallStressLevel,
        ndwi_analysis: mockNdwiData,
        weather_data: mockWeatherData,
        recommendations: mockRecommendations,
        data_source: "mock",
        error_message: weatherError || error.message,
        setup_instructions: !verifyWeatherConfig() ? 
          "To get real weather data, add OPENWEATHER_API_KEY to your .env file. Get a free API key at https://openweathermap.org/api" : 
          null
      };
      
      res.json(response);
    }
  } catch (error) {
    console.error("Error in water stress analysis:", error);
    res.status(500).json({ 
      message: "Error in water stress analysis", 
      error: error.message 
    });
  }
};

/**
 * Get crop health analysis for a farm
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCropHealth = async (req, res) => {
  try {
    const farmId = req.params.farm_id;
    console.log(`Processing crop health request for farm ID: ${farmId}`);
    
    const farmRepository = AppDataSource.getRepository(Farm);

    // Get farm data
    console.log("Fetching farm data from database...");
    const farm = await farmRepository.findOne({ 
      where: { id: farmId },
      select: ["id", "farmer_id", "farm_id", "Draw_Farm", "farm_type", 
               "crop_type", "calculated_area", "farm_latitude", "farm_longitude", "geom"] 
    });
    
    if (!farm) {
      console.log(`Farm with ID ${farmId} not found`);
      return res.status(404).json({ message: "Farm not found" });
    }
    
    console.log(`Farm found: ${farm.id}, crop type: ${farm.crop_type || 'Unknown'}`);

    // Calculate growth stage based on crop type
    const growthStage = calculateGrowthStage(farm.crop_type);
    console.log(`Calculated growth stage: ${growthStage}`);

    // Set up date range for satellite imagery (last 30 days)
    const endDate = new Date().toISOString();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    try {
      // Try to get real NDVI data
      console.log("Attempting to get real NDVI data...");
      
      const coordinates = extractCoordinates(null, farm);
      
      const ndviAnalysis = await getNDVIAnalysis(
        farm.calculated_area || 1,
        coordinates,
        startDate.toISOString(),
        endDate,
        farm.crop_type
      );
      
      // Generate additional insights based on NDVI data
      const overallHealthIndex = calculateHealthIndex(ndviAnalysis.zones);
      const alerts = generateAlerts(ndviAnalysis.zones);
      const recommendations = generateRecommendations(alerts, farm.crop_type, growthStage);

      console.log(`Analysis complete: Health index: ${overallHealthIndex}, Status: ${getOverallStatus(overallHealthIndex)}`);

      // Format and send response
      const response = {
        farm_id: farmId,
        analysis_date: new Date().toISOString(),
        crop: farm.crop_type || "Unknown",
        growth_stage: growthStage,
        overall_health_index: overallHealthIndex,
        status: getOverallStatus(overallHealthIndex),
        ndvi_analysis: ndviAnalysis,
        alerts,
        recommendations
      };

      res.json(response);
    } catch (error) {
      console.error("Error getting real NDVI data:", error);
      console.log("Falling back to mock data");
      
      // Use mock data as fallback
      const mockData = getMockNdviAnalysis(farm.calculated_area || 1);
      const overallHealthIndex = calculateHealthIndex(mockData.zones);
      const alerts = generateAlerts(mockData.zones);
      const recommendations = generateRecommendations(alerts, farm.crop_type, growthStage);
      
      const response = {
        farm_id: farmId,
        analysis_date: new Date().toISOString(),
        crop: farm.crop_type || "Unknown",
        growth_stage: growthStage,
        overall_health_index: overallHealthIndex,
        status: getOverallStatus(overallHealthIndex),
        ndvi_analysis: mockData,
        alerts,
        recommendations,
        data_source: "mock",
        error_message: error.message
      };
      
      res.json(response);
    }
  } catch (error) {
    console.error("Error in crop health analysis:", error);
    res.status(500).json({ 
      message: "Error in crop health analysis", 
      error: error.message 
    });
  }
};

/**
 * Get fertilizer recommendations for a farm
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getFertilizerRecommendation = async (req, res) => {
  try {
    const farmId = req.params.farm_id;
    console.log(`Processing enhanced fertilizer recommendation request for farm ID: ${farmId}`);
    
    const farmRepository = AppDataSource.getRepository(Farm);

    // Get farm data
    console.log("Fetching farm data from database...");
    const farm = await farmRepository.findOne({ 
      where: { id: farmId },
      select: ["id", "farmer_id", "farm_id", "Draw_Farm", "farm_type", 
               "crop_type", "calculated_area", "farm_latitude", "farm_longitude", "geom"] 
    });
    
    if (!farm) {
      console.log(`Farm with ID ${farmId} not found`);
      return res.status(404).json({ message: "Farm not found" });
    }
    
    console.log(`Farm found: ${farm.id}, crop type: ${farm.crop_type || 'Unknown'}`);
    console.log(`Farm size: ${farm.calculated_area || 0} acres`);

    // Convert acres to hectares for calculations
    const farmSizeHectares = (farm.calculated_area || 1) * 0.404686;
    console.log(`Farm size in hectares: ${farmSizeHectares}`);

    try {
      // REPLACE THIS ENTIRE SECTION WITH ENHANCED ANALYSIS
      console.log("Starting enhanced fertilizer analysis combining soil and vegetation data...");
      
      const enhancedRecommendations = await getEnhancedFertilizerRecommendations(farm, farmSizeHectares);
      
      console.log(`Enhanced fertilizer analysis complete: Total quantity: ${enhancedRecommendations.recommendations.total_fertilizer_quantity} kg`);
      console.log(`Vegetation health status: ${enhancedRecommendations.vegetation_analysis.overall_health}`);

      // Format and send enhanced response
      const response = {
        farm_id: farmId,
        crop: farm.crop_type || "Unknown",
        farm_size_hectares: parseFloat(farmSizeHectares.toFixed(2)),
        soil_analysis: enhancedRecommendations.soil_analysis,
        vegetation_analysis: enhancedRecommendations.vegetation_analysis,
        recommendations: enhancedRecommendations.recommendations,
        commercial_products: enhancedRecommendations.commercial_products,
        commentary: enhancedRecommendations.commentary,
        vegetation_insights: enhancedRecommendations.vegetation_insights,
        data_source: enhancedRecommendations.data_source
      };

      res.json(response);

    } catch (error) {
      console.error("Error in enhanced fertilizer analysis:", error);
      console.log("Falling back to traditional soil-based analysis with mock vegetation data");
      
      // FALLBACK: Use traditional approach with mock vegetation data
      const coordinates = extractCoordinates(null, farm);
      const centerLat = coordinates.length > 0 ? coordinates[0][1] : farm.farm_latitude;
      const centerLng = coordinates.length > 0 ? coordinates[0][0] : farm.farm_longitude;
      
      console.log(`Using coordinates for soil analysis: ${centerLat}, ${centerLng}`);

      try {
        // Get soil data from ISDA API for all required nutrients
        console.log("Fetching soil nutrient data from ISDA API...");
        const soilNutrients = [
          "nitrogen_total",
          "phosphorous_extractable", 
          "potassium_extractable",
          "magnesium_extractable",
          "calcium_extractable",
          "sulphur_extractable",
          "iron_extractable"
        ];

        // Fetch all soil data in parallel
        const soilDataPromises = soilNutrients.map(nutrient => 
          getISDASoilData(centerLat, centerLng, nutrient)
        );
        
        const soilDataResults = await Promise.all(soilDataPromises);
        console.log("All ISDA API calls completed");

        // Process soil analysis results
        const soilAnalysis = {};
        soilDataResults.forEach(result => {
          if (result.success) {
            const classification = classifyNutrientStatus(result.elementName, result.value);
            soilAnalysis[result.elementName] = {
              status: classification.status,
              value: result.value,
              unit: result.unit,
              name: classification.name
            };
            console.log(`${result.elementName}: ${result.value} ${result.unit} - Status: ${classification.status}`);
          } else {
            console.warn(`Failed to get data for ${result.elementName}: ${result.error}`);
            // Use default values for failed requests
            soilAnalysis[result.elementName] = {
              status: "Medium",
              value: 0,
              unit: "mg/kg",
              name: result.elementName.split("_")[0]
            };
          }
        });

        // Calculate fertilizer requirements
        console.log("Calculating fertilizer requirements...");
        const fertilizerCalc = calculateFertilizerRequirements(
          soilAnalysis, 
          farm.crop_type || "maize", 
          farmSizeHectares
        );

        // Generate application schedule
        const applicationSchedule = calculateApplicationSchedule(
          fertilizerCalc.total_fertilizer_quantity,
          farm.crop_type || "maize"
        );

        // Generate commercial product recommendations
        const commercialProducts = generateCommercialProducts(
          fertilizerCalc.composition,
          fertilizerCalc.total_fertilizer_quantity
        );

        console.log(`Fertilizer calculation complete: Total quantity: ${fertilizerCalc.total_fertilizer_quantity} kg`);

        // Format and send response
        const response = {
          farm_id: farmId,
          crop: farm.crop_type || "Unknown",
          farm_size_hectares: parseFloat(farmSizeHectares.toFixed(2)),
          soil_analysis: soilAnalysis,
          recommendations: {
            total_fertilizer_quantity: fertilizerCalc.total_fertilizer_quantity,
            unit: "kg",
            composition: fertilizerCalc.composition,
            application_schedule: applicationSchedule
          },
          commercial_products: commercialProducts,
          commentary: fertilizerCalc.commentary || "No specific deficiencies detected. Follow standard fertilization practices for optimal crop growth.",
          data_source: "soil_only",
          vegetation_analysis: null,
          vegetation_insights: null,
          error_message: "Could not retrieve vegetation data - recommendations based on soil analysis only"
        };

        res.json(response);

      } catch (soilError) {
        console.error("Error getting soil data from ISDA API:", soilError);
        console.log("Falling back to mock soil data");
        
        // Fallback to mock data
        const mockSoilAnalysis = getMockSoilAnalysis();
        const fertilizerCalc = calculateFertilizerRequirements(
          mockSoilAnalysis, 
          farm.crop_type || "maize", 
          farmSizeHectares
        );

        const applicationSchedule = calculateApplicationSchedule(
          fertilizerCalc.total_fertilizer_quantity,
          farm.crop_type || "maize"
        );

        const commercialProducts = generateCommercialProducts(
          fertilizerCalc.composition,
          fertilizerCalc.total_fertilizer_quantity
        );

        const response = {
          farm_id: farmId,
          crop: farm.crop_type || "Unknown", 
          farm_size_hectares: parseFloat(farmSizeHectares.toFixed(2)),
          soil_analysis: mockSoilAnalysis,
          recommendations: {
            total_fertilizer_quantity: fertilizerCalc.total_fertilizer_quantity,
            unit: "kg",
            composition: fertilizerCalc.composition,
            application_schedule: applicationSchedule
          },
          commercial_products: commercialProducts,
          commentary: fertilizerCalc.commentary,
          data_source: "mock",
          error_message: error.message
        };

        res.json(response);
      }
    }

  } catch (error) {
    console.error("Error in fertilizer recommendation:", error);
    res.status(500).json({ 
      message: "Error in fertilizer recommendation", 
      error: error.message 
    });
  }
};

module.exports = {
  getCropHealth,
  getFertilizerRecommendation,
  getWaterStress
};