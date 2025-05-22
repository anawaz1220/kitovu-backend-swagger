const AppDataSource = require("../data-source");
const Farm = require("../entities/Farm");
const Farmer = require("../entities/Farmer");
const axios = require("axios");
const turf = require("@turf/turf");

// Import the new utility modules
const { FR_DATA, COMMERCIAL_FERTILIZERS } = require("../utils/fertilizerData");
const { classifyNutrientStatus } = require("../utils/soilClassification");
const { getCommentaryForDeficiency } = require("../utils/fertilizerCommentary");

// NDVI color legend values from agent.js
const legend_ndvi = [
  [26, 152, 80],   // Excellent (0.8-0.9)
  [102, 189, 99],  // Excellent (0.7-0.8)
  [166, 217, 106], // Good (0.6-0.7)
  [217, 239, 139], // Good (0.5-0.6)
  [255, 255, 191], // Fair (0.4-0.5)
  [254, 224, 139], // Fair (0.3-0.4)
  [253, 174, 97],  // Poor (0.2-0.3)
  [244, 109, 67],  // Poor (0.1-0.2)
  [215, 48, 39],   // Very Poor (<0.1)
  [165, 0, 38]     // Very Poor (<0)
];

// Status mapping for NDVI ranges
const ndviStatusMap = [
  { range: "0.8-0.9", status: "Excellent" },
  { range: "0.7-0.8", status: "Excellent" },
  { range: "0.6-0.7", status: "Good" },
  { range: "0.5-0.6", status: "Good" },
  { range: "0.4-0.5", status: "Fair" },
  { range: "0.3-0.4", status: "Fair" },
  { range: "0.2-0.3", status: "Poor" },
  { range: "0.1-0.2", status: "Poor" },
  { range: "0-0.1", status: "Very Poor" },
  { range: "<0", status: "Very Poor" }
];

/**
 * Get ISDA soil data for a specific location and nutrient
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude  
 * @param {string} elementName - Soil nutrient parameter
 * @returns {Promise<Object>} - Soil data response
 */
const getISDASoilData = async (lat, lng, elementName) => {
  try {
    console.log(`Fetching ISDA data for ${elementName} at coordinates: ${lat}, ${lng}`);
    
    const isdaApiKey = "AIzaSyAslZKx_0RPhcZBRbOOasVC81haowqNYxs";
    const depth = "0-20"; // Standard topsoil depth
    
    const url = `https://api.isda-africa.com/v1/soilproperty?key=${isdaApiKey}&lat=${lat}&lon=${lng}&property=${elementName}&depth=${depth}`;
    
    console.log(`ISDA API URL: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });
    
    console.log(`ISDA API response status: ${response.status}`);
    console.log(`ISDA API response for ${elementName}:`, JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.property && response.data.property[elementName]) {
      const propertyData = response.data.property[elementName][0];
      const value = propertyData.value.value;
      const unit = propertyData.value.unit || "mg/kg";
      
      console.log(`Successfully extracted ${elementName}: ${value} ${unit}`);
      
      return {
        success: true,
        value: parseFloat(value),
        unit: unit,
        elementName: elementName
      };
    } else {
      console.warn(`No data found for ${elementName} in ISDA response`);
      return {
        success: false,
        error: `No data available for ${elementName}`,
        elementName: elementName
      };
    }
    
  } catch (error) {
    console.error(`Error fetching ISDA data for ${elementName}:`, error.message);
    
    if (error.response) {
      console.error(`ISDA API Error Status: ${error.response.status}`);
      console.error(`ISDA API Error Data:`, error.response.data);
    }
    
    return {
      success: false,
      error: error.message,
      elementName: elementName
    };
  }
};

/**
 * Calculate fertilizer requirements based on soil analysis
 * @param {Object} soilAnalysis - Soil nutrient analysis
 * @param {string} cropType - Type of crop
 * @param {number} farmSize - Farm size in hectares
 * @returns {Object} - Fertilizer recommendations
 */
const calculateFertilizerRequirements = (soilAnalysis, cropType, farmSize) => {
  console.log(`Calculating fertilizer requirements for ${cropType}, farm size: ${farmSize} hectares`);
  
  const cropData = FR_DATA[cropType.toLowerCase()];
  if (!cropData) {
    console.warn(`No fertilizer data available for crop: ${cropType}`);
    return {
      total_fertilizer_quantity: 0,
      composition: [],
      commentary: `No specific fertilizer recommendations available for ${cropType}`
    };
  }

  let totalFertilizerQuantity = 0;
  const composition = [];
  let commentary = "";

  // Process each nutrient
  Object.keys(soilAnalysis).forEach(nutrientKey => {
    const nutrient = soilAnalysis[nutrientKey];
    if (nutrient.status && cropData[nutrientKey]) {
      const requiredPerHectare = cropData[nutrientKey][nutrient.status] || 0;
      const totalRequired = requiredPerHectare * farmSize;
      
      console.log(`${nutrientKey}: Status=${nutrient.status}, Required per hectare=${requiredPerHectare}, Total=${totalRequired}`);
      
      totalFertilizerQuantity += totalRequired;
      
      if (totalRequired > 0) {
        composition.push({
          type: nutrient.name.charAt(0).toUpperCase() + nutrient.name.slice(1),
          quantity: parseFloat(totalRequired.toFixed(2)),
          unit: "kg"
        });
        
        // Add commentary for deficiencies
        const deficiencyCommentary = getCommentaryForDeficiency(nutrient.name, nutrient.status);
        if (deficiencyCommentary) {
          commentary += deficiencyCommentary + " ";
        }
      }
    }
  });

  return {
    total_fertilizer_quantity: parseFloat(totalFertilizerQuantity.toFixed(2)),
    composition: composition,
    commentary: commentary.trim()
  };
};

/**
 * Calculate application schedule based on crop type and growth stage
 * @param {number} totalQuantity - Total fertilizer quantity
 * @param {string} cropType - Type of crop
 * @returns {Array} - Application schedule
 */
const calculateApplicationSchedule = (totalQuantity, cropType) => {
  // Default schedule - can be customized per crop type
  const schedules = {
    maize: [
      { stage: "Planting", percentage: 40 },
      { stage: "Vegetative", percentage: 60 }
    ],
    rice: [
      { stage: "Transplanting", percentage: 30 },
      { stage: "Tillering", percentage: 40 },
      { stage: "Panicle Initiation", percentage: 30 }
    ],
    default: [
      { stage: "Planting", percentage: 40 },
      { stage: "Vegetative", percentage: 60 }
    ]
  };

  const schedule = schedules[cropType.toLowerCase()] || schedules.default;
  
  return schedule.map(stage => ({
    stage: stage.stage,
    percentage: stage.percentage,
    quantity: parseFloat((totalQuantity * stage.percentage / 100).toFixed(2)),
    unit: "kg"
  }));
};

/**
 * Generate commercial fertilizer product recommendations
 * @param {Array} composition - Nutrient composition requirements
 * @param {number} totalQuantity - Total fertilizer needed
 * @returns {Array} - Commercial product recommendations
 */
const generateCommercialProducts = (composition, totalQuantity) => {
  const products = [];
  
  // Calculate primary NPK needs
  const nRequirement = composition.find(c => c.type.toLowerCase() === 'nitrogen')?.quantity || 0;
  const pRequirement = composition.find(c => c.type.toLowerCase() === 'phosphorous')?.quantity || 0;
  const kRequirement = composition.find(c => c.type.toLowerCase() === 'potassium')?.quantity || 0;
  
  console.log(`NPK Requirements - N: ${nRequirement}, P: ${pRequirement}, K: ${kRequirement}`);
  
  // Recommend compound fertilizer first (NPK 15-15-15 as primary)
  if (nRequirement > 0 || pRequirement > 0 || kRequirement > 0) {
    const npk1515 = COMMERCIAL_FERTILIZERS.compound.find(f => f.name === "NPK 15-15-15");
    if (npk1515) {
      // Calculate quantity needed based on the highest requirement
      const maxRequirement = Math.max(nRequirement, pRequirement, kRequirement);
      const npkQuantity = Math.max(
        nRequirement / (npk1515.composition.N / 100),
        pRequirement / (npk1515.composition.P / 100),
        kRequirement / (npk1515.composition.K / 100)
      );
      
      products.push({
        name: npk1515.name,
        quantity: parseFloat(Math.min(npkQuantity, totalQuantity * 0.7).toFixed(2)), // Max 70% of total
        unit: "kg"
      });
    }
  }
  
  // Add supplementary Urea if more nitrogen is needed
  if (nRequirement > 0) {
    const urea = COMMERCIAL_FERTILIZERS.nitrogen.find(f => f.name === "Urea");
    if (urea) {
      const remainingN = nRequirement * 0.4; // Assume 40% additional N needed
      const ureaNeed = remainingN / (urea.composition.N / 100);
      
      if (ureaNeed > 10) { // Only recommend if significant amount needed
        products.push({
          name: urea.name,
          quantity: parseFloat(ureaNeed.toFixed(2)),
          unit: "kg"
        });
      }
    }
  }
  
  return products;
};

/**
 * Get mock soil analysis data for testing
 * @returns {Object} - Mock soil analysis results
 */
const getMockSoilAnalysis = () => {
  return {
    "nitrogen_total": {
      "status": "Low",
      "value": 18.4,
      "unit": "mg/kg",
      "name": "nitrogen"
    },
    "phosphorous_extractable": {
      "status": "Medium", 
      "value": 35.6,
      "unit": "mg/kg",
      "name": "phosphorous"
    },
    "potassium_extractable": {
      "status": "High",
      "value": 156.2,
      "unit": "mg/kg", 
      "name": "potassium"
    },
    "magnesium_extractable": {
      "status": "Medium",
      "value": 42.1,
      "unit": "mg/kg",
      "name": "magnesium"
    },
    "calcium_extractable": {
      "status": "Medium",
      "value": 112.8,
      "unit": "mg/kg",
      "name": "calcium"
    },
    "sulphur_extractable": {
      "status": "Low",
      "value": 4.6,
      "unit": "mg/kg",
      "name": "sulphur"
    },
    "iron_extractable": {
      "status": "Medium",
      "value": 85.3,
      "unit": "mg/kg",
      "name": "iron"
    }
  };
};

/**
 * Get fertilizer recommendations for a farm
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getFertilizerRecommendation = async (req, res) => {
  try {
    const farmId = req.params.farm_id;
    console.log(`Processing fertilizer recommendation request for farm ID: ${farmId}`);
    
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

    // Extract coordinates for ISDA API
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
        commentary: fertilizerCalc.commentary || "No specific deficiencies detected. Follow standard fertilization practices for optimal crop growth."
      };

      res.json(response);

    } catch (error) {
      console.error("Error getting soil data from ISDA API:", error);
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
        data_source: "mock", // Clearly indicate this is mock data
        error_message: error.message // Include the error message for debugging
      };

      res.json(response);
    }

  } catch (error) {
    console.error("Error in fertilizer recommendation:", error);
    res.status(500).json({ 
      message: "Error in fertilizer recommendation", 
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
        // Make sure to select all needed fields, especially geom
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
        
        // Extract coordinates directly from the farm object
        // Don't try to parse Draw_Farm as JSON first
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
          data_source: "mock", // Clearly indicate this is mock data
          error_message: error.message // Include the error message for debugging
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
 * Get mock NDVI analysis data for testing
 * @param {number} farmSize - Size of the farm in acres
 * @returns {Object} - NDVI analysis results
 */
const getMockNdviAnalysis = (farmSize) => {
  return {
    average_ndvi: 0.72,
    min_ndvi: 0.48,
    max_ndvi: 0.85,
    zones: [
      {
        zone_id: 1,
        status: "Excellent",
        ndvi_range: "0.75-0.85",
        area_percentage: 35.4,
        area_hectares: farmSize * 0.354 * 0.404686 // Convert acres to hectares
      },
      {
        zone_id: 2,
        status: "Good",
        ndvi_range: "0.6-0.75",
        area_percentage: 42.8,
        area_hectares: farmSize * 0.428 * 0.404686
      },
      {
        zone_id: 3,
        status: "Fair",
        ndvi_range: "0.45-0.6",
        area_percentage: 21.8,
        area_hectares: farmSize * 0.218 * 0.404686
      }
    ]
  };
};

/**
 * Calculate the growth stage based on crop type and planting date
 * @param {string} cropType - Type of crop
 * @returns {string} - Growth stage
 */
const calculateGrowthStage = (cropType) => {
  // For now, return a default stage as we don't have planting date
  // This function can be expanded to calculate actual growth stage based on 
  // planting date and crop-specific growth patterns
  return "vegetative";
};

/**
 * Get Sentinel Hub token
 * @returns {Promise<string>} - Sentinel Hub token
 */
const getSentinelToken = async () => {
    try {
      console.log("Requesting Sentinel Hub token...");
      
      // Get credentials from environment variables
      const clientId = process.env.SENTINEL_HUB_CLIENT_ID;
      const clientSecret = process.env.SENTINEL_HUB_CLIENT_SECRET;
      
      // Check if credentials are available
      if (!clientId || !clientSecret) {
        throw new Error("Missing Sentinel Hub credentials in environment variables");
      }
      
      const response = await axios({
        method: 'post',
        url: 'https://services.sentinel-hub.com/oauth/token',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
      });
      
      console.log("Successfully retrieved Sentinel Hub token");
      return response.data.access_token;
    } catch (error) {
      console.error("Error getting Sentinel Hub token:", error.message);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", JSON.stringify(error.response.data));
      }
      throw new Error(`Failed to obtain Sentinel Hub token: ${error.message}`);
    }
  };

/**
 * Verify required environment variables are set
 * @returns {boolean} - True if all required variables are set
 */
const verifyEnvironmentVariables = () => {
    const requiredVars = [
      'JWT_SECRET',
      'SENTINEL_HUB_CLIENT_ID',
      'SENTINEL_HUB_CLIENT_SECRET'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
      return false;
    }
    
    return true;
  };
  
  // Add this to your index.js or app initialization
  if (!verifyEnvironmentVariables()) {
    console.error("Application cannot start due to missing environment variables");
    process.exit(1);
  }
  
/**
 * Process NDVI image from Sentinel Hub response
 * @param {Buffer} imageData - Image data buffer from Sentinel Hub
 * @param {number} farmSize - Size of the farm in acres
 * @returns {Object} NDVI analysis
 */
const processNDVIImage = async (imageData, farmSize) => {
    try {
      console.log("Loading image data for processing...");
      
      // Simplify by just using CommonJS require
      // Skip the dynamic import which might be causing issues
      const Jimp = require('jimp');
      console.log("Loaded Jimp via CommonJS require");
      
      // For debugging, save the image to disk
      const fs = require('fs');
      const debug_path = 'debug_satellite_image.png';
      fs.writeFileSync(debug_path, imageData);
      console.log(`Saved debug image to ${debug_path}`);
      
      // Try to load the image from the file instead of the buffer
      console.log("Reading image with Jimp from file...");
      const image = await Jimp.read(debug_path);
      console.log(`Image loaded: ${image.getWidth()}x${image.getHeight()} pixels`);
      
      // Rest of the function stays the same - analyzing the image
      // Initialize zone counters based on NDVI color legend
      const zones = new Array(10).fill(0);
      
      // Initialize NDVI aggregate values for statistics
      let totalNdvi = 0;
      let minNdvi = 1.0;
      let maxNdvi = -1.0;
      let pixelCount = 0;
      
      // NDVI color ranges (from legend_ndvi in agent.js)
      const ndviColors = [
        { rgb: [26, 152, 80], ndviValue: 0.85, status: "Excellent", range: "0.8-0.9" },
        { rgb: [102, 189, 99], ndviValue: 0.75, status: "Excellent", range: "0.7-0.8" },
        { rgb: [166, 217, 106], ndviValue: 0.65, status: "Good", range: "0.6-0.7" },
        { rgb: [217, 239, 139], ndviValue: 0.55, status: "Good", range: "0.5-0.6" },
        { rgb: [255, 255, 191], ndviValue: 0.45, status: "Fair", range: "0.4-0.5" },
        { rgb: [254, 224, 139], ndviValue: 0.35, status: "Fair", range: "0.3-0.4" },
        { rgb: [253, 174, 97], ndviValue: 0.25, status: "Poor", range: "0.2-0.3" },
        { rgb: [244, 109, 67], ndviValue: 0.15, status: "Poor", range: "0.1-0.2" },
        { rgb: [215, 48, 39], ndviValue: 0.05, status: "Very Poor", range: "0-0.1" },
        { rgb: [165, 0, 38], ndviValue: -0.05, status: "Very Poor", range: "<0" }
      ];
      
      // Function to calculate color similarity
      const colorSimilarity = (rgb1, rgb2, tolerance = 25) => {
        return Math.abs(rgb1[0] - rgb2[0]) <= tolerance && 
               Math.abs(rgb1[1] - rgb2[1]) <= tolerance && 
               Math.abs(rgb1[2] - rgb2[2]) <= tolerance;
      };
      
      console.log("Analyzing image pixels for NDVI data...");
      
      // Scan the image and classify pixels by color to determine NDVI zones
      image.scan(0, 0, image.getWidth(), image.getHeight(), function(x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];
        const a = this.bitmap.data[idx + 3];
        
        // Skip transparent pixels
        if (a < 128) return;
        
        // Check which NDVI color range this pixel falls into
        for (let i = 0; i < ndviColors.length; i++) {
          if (colorSimilarity([r, g, b], ndviColors[i].rgb)) {
            zones[i]++;
            
            // Update statistics
            const ndviValue = ndviColors[i].ndviValue;
            totalNdvi += ndviValue;
            minNdvi = Math.min(minNdvi, ndviValue);
            maxNdvi = Math.max(maxNdvi, ndviValue);
            pixelCount++;
            
            break;
          }
        }
      });
      
      console.log(`Analyzed ${pixelCount} valid pixels`);
      
      // Calculate average NDVI
      const avgNdvi = pixelCount > 0 ? totalNdvi / pixelCount : 0;
      
      // Calculate zone percentages and areas
      const totalPixels = zones.reduce((sum, count) => sum + count, 0);
      
      // Prepare the resulting zones analysis
      const zonesAnalysis = [];
      let zoneId = 1;
      
      // Group zones by status (Excellent, Good, Fair, Poor, Very Poor)
      const groupedZones = {};
      
      for (let i = 0; i < zones.length; i++) {
        if (zones[i] === 0) continue;
        
        const percentage = (zones[i] / totalPixels) * 100;
        const areaHectares = (percentage / 100) * farmSize * 0.404686; // Convert acres to hectares
        
        const status = ndviColors[i].status;
        
        // Group by status
        if (!groupedZones[status]) {
          groupedZones[status] = {
            percentage: percentage,
            areaHectares: areaHectares,
            range: ndviColors[i].range
          };
        } else {
          groupedZones[status].percentage += percentage;
          groupedZones[status].areaHectares += areaHectares;
          // Use the range of the more significant zone (the one with higher percentage)
          if (percentage > groupedZones[status].percentage) {
            groupedZones[status].range = ndviColors[i].range;
          }
        }
      }
      
      // Convert grouped zones to array
      for (const status in groupedZones) {
        zonesAnalysis.push({
          zone_id: zoneId++,
          status: status,
          ndvi_range: groupedZones[status].range,
          area_percentage: parseFloat(groupedZones[status].percentage.toFixed(1)),
          area_hectares: parseFloat(groupedZones[status].areaHectares.toFixed(4))
        });
      }
      
      // Sort zones by status (from best to worst)
      const statusOrder = ["Excellent", "Good", "Fair", "Poor", "Very Poor"];
      zonesAnalysis.sort((a, b) => {
        return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
      });
      
      console.log("NDVI analysis complete:", zonesAnalysis);
      
      return {
        average_ndvi: parseFloat(avgNdvi.toFixed(2)),
        min_ndvi: parseFloat(minNdvi.toFixed(2)),
        max_ndvi: parseFloat(maxNdvi.toFixed(2)),
        zones: zonesAnalysis
      };
    } catch (error) {
      console.error("Error processing NDVI image:", error);
      throw new Error(`Failed to process image data: ${error.message}`);
    }
  };

/**
 * Get NDVI analysis from Sentinel Hub
 * @param {number} farmSize - Size of the farm in acres
 * @param {Array} coordinates - Array of [lng, lat] coordinates
 * @param {string} startDate - Start date for imagery
 * @param {string} endDate - End date for imagery
 * @param {string} cropType - Type of crop
 * @returns {Object} - NDVI analysis results
 */
const getNDVIAnalysis = async (farmSize, coordinates, startDate, endDate, cropType) => {
    try {
      // Get Sentinel Hub token
      const token = await getSentinelToken();
      
      console.log(`Coordinates for API request: ${JSON.stringify(coordinates)}`);
      
      // Validate coordinates - ensure we have valid points
      if (!coordinates || coordinates.length < 3) {
        throw new Error("Invalid coordinates: need at least 3 points for a polygon");
      }
      
      // Calculate bbox from coordinates
      const lons = coordinates.map(c => c[0]);
      const lats = coordinates.map(c => c[1]);
      const bbox = [
        Math.min(...lons),
        Math.min(...lats),
        Math.max(...lons),
        Math.max(...lats)
      ];
      
      console.log(`Calculated bounding box: ${JSON.stringify(bbox)}`);
      console.log("Preparing request to Sentinel Hub...");
      
      // Create a more detailed evalscript for better NDVI calculation
      const evalScript = `
      //VERSION=3
      function setup() {
        return {
          input: ["B04", "B08", "dataMask"],
          output: { bands: 3 }
        };
      }
      
      function evaluatePixel(sample) {
        let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
        
        // Apply NDVI color scheme
        let color;
        if (ndvi < 0) color = [0.647, 0, 0.149];
        else if (ndvi < 0.1) color = [0.843, 0.188, 0.153];
        else if (ndvi < 0.2) color = [0.957, 0.427, 0.263];
        else if (ndvi < 0.3) color = [0.992, 0.682, 0.38];
        else if (ndvi < 0.4) color = [0.996, 0.878, 0.545];
        else if (ndvi < 0.5) color = [1, 1, 0.749];
        else if (ndvi < 0.6) color = [0.851, 0.937, 0.545];
        else if (ndvi < 0.7) color = [0.651, 0.851, 0.416];
        else if (ndvi < 0.8) color = [0.4, 0.741, 0.388];
        else if (ndvi < 0.9) color = [0.102, 0.596, 0.314];
        else color = [0, 0.408, 0.216];
        
        return color;
      }
      `;
      
      // Prepare the request
      const requestData = {
        input: {
          bounds: {
            bbox: bbox
          },
          data: [
            {
              type: "sentinel-2-l2a",
              dataFilter: {
                timeRange: {
                  from: startDate,
                  to: endDate
                },
                mosaickingOrder: "leastCC"
              }
            }
          ]
        },
        output: {
          width: 512,
          height: 512,
          responses: [
            {
              identifier: "default",
              format: { type: "image/png" }
            }
          ]
        },
        evalscript: evalScript
      };
      
      console.log("Making API request to Sentinel Hub...");
      
      const response = await axios.post(
        "https://services.sentinel-hub.com/api/v1/process",
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
            "Accept": "image/png",
            "Authorization": `Bearer ${token}`
          },
          responseType: 'arraybuffer'
        }
      );
      
      console.log("Successfully received data from Sentinel Hub");
      
      // Process the image to calculate NDVI zones
      console.log("Processing image data...");
      const ndviAnalysis = await processNDVIImage(response.data, farmSize);
      console.log("NDVI analysis successful");
      return ndviAnalysis;
    } catch (error) {
      console.error("Error getting NDVI data:", error);
      
      // Try to extract useful error information
      if (error.response && error.response.data) {
        try {
          const decoder = new TextDecoder('utf-8');
          const errorText = decoder.decode(error.response.data);
          console.error("Response data:", errorText);
        } catch (e) {
          console.error("Could not decode error response");
        }
      }
      
      throw new Error(`Failed to get NDVI data: ${error.message}`);
    }
  };

/**
 * Extract coordinates from farm data
 * @param {Object} boundaries - Not used when geom is available
 * @param {Object} farm - Farm data with geom field
 * @returns {Array} - Array of coordinates
 */
const extractCoordinates = (boundaries, farm) => {
    try {
      console.log("Attempting to extract coordinates from farm data...");
      
      // First try to use the geom field if it's properly formatted
      if (farm && farm.geom) {
        console.log("Found geom field in farm data");
        
        // Convert geom to object if it's a string
        let geomData = farm.geom;
        if (typeof geomData === 'string') {
          try {
            geomData = JSON.parse(geomData);
            console.log("Successfully parsed geom from string to object");
          } catch (e) {
            console.log(`Could not parse geom as JSON: ${e.message}`);
          }
        }
        
        // Check if geom has the expected structure
        if (geomData && 
            geomData.type === 'MultiPolygon' && 
            Array.isArray(geomData.coordinates) && 
            geomData.coordinates.length > 0 && 
            Array.isArray(geomData.coordinates[0]) && 
            geomData.coordinates[0].length > 0 &&
            Array.isArray(geomData.coordinates[0][0])) {
          
          // Get the coordinates of the first polygon (outer ring)
          const coords = geomData.coordinates[0][0];
          
          // Check if we have valid coordinates
          if (coords && coords.length > 2) { // Need at least 3 points for a polygon
            console.log(`Successfully extracted ${coords.length} points from geom field`);
            
            // Convert coordinates format if needed - [lng, lat] is required by Sentinel Hub
            // Check if coordinates are already in [lng, lat] format or [lat, lng]
            // This is a simple heuristic - if first coordinate's first value (x) is > 90, 
            // it's likely longitude which comes first
            const firstCoord = coords[0];
            if (Math.abs(firstCoord[0]) > 90) {
              // Already in [lng, lat] format
              console.log("Coordinates already in [lng, lat] format");
              return coords;
            } else {
              // Need to swap to [lng, lat] format
              console.log("Converting coordinates from [lat, lng] to [lng, lat]");
              return coords.map(coord => [coord[1], coord[0]]);
            }
          }
        }
      }
      
      console.log("Could not extract coordinates from geom, trying Draw_Farm field");
      
      // If geom doesn't work, try the Draw_Farm field
      if (farm && farm.Draw_Farm && typeof farm.Draw_Farm === 'string') {
        console.log(`Parsing Draw_Farm field: ${farm.Draw_Farm}`);
        
        try {
          // Format appears to be: "lat1 lng1 other1 other2; lat2 lng2 other1 other2; ..."
          const points = farm.Draw_Farm.split(';').map(point => {
            const parts = point.trim().split(' ');
            if (parts.length >= 2) {
              // First two values appear to be latitude and longitude
              const lat = parseFloat(parts[0]);
              const lng = parseFloat(parts[1]);
              return [lng, lat]; // [lng, lat] format as required by Sentinel Hub
            }
            return null;
          }).filter(p => p !== null);
          
          // Ensure the polygon is closed
          if (points.length > 0) {
            // Add first point at the end if not already there
            if (points[0][0] !== points[points.length - 1][0] || 
                points[0][1] !== points[points.length - 1][1]) {
              points.push([...points[0]]);
            }
            
            console.log(`Successfully extracted ${points.length} points from Draw_Farm`);
            return points;
          }
        } catch (e) {
          console.log(`Error parsing Draw_Farm: ${e.message}`);
        }
      }
      
      // Try using farm_latitude and farm_longitude if available
      if (farm && farm.farm_latitude && farm.farm_longitude) {
        console.log(`Using farm_latitude=${farm.farm_latitude} and farm_longitude=${farm.farm_longitude}`);
        const lat = parseFloat(farm.farm_latitude);
        const lng = parseFloat(farm.farm_longitude);
        
        // Create a small square around the point (approximately 100m x 100m)
        const offset = 0.001; // Roughly 100 meters at the equator
        const points = [
          [lng - offset, lat - offset],
          [lng + offset, lat - offset],
          [lng + offset, lat + offset],
          [lng - offset, lat + offset],
          [lng - offset, lat - offset] // Close the polygon
        ];
        
        console.log(`Created bounding box with ${points.length} points from center coordinates`);
        return points;
      }
      
      // If we reach this point, we couldn't extract valid coordinates
      console.warn("Could not extract valid coordinates from farm data, using default Nigeria coordinates");
      
      // Default to a location in Nigeria
      return [
        [8.6753, 9.0820],
        [8.6853, 9.0820],
        [8.6853, 9.0920],
        [8.6753, 9.0920],
        [8.6753, 9.0820]
      ];
    } catch (error) {
      console.error(`Error extracting coordinates: ${error.message}`);
      
      // Return default coordinates on error
      return [
        [8.6753, 9.0820],
        [8.6853, 9.0820],
        [8.6853, 9.0920],
        [8.6753, 9.0920],
        [8.6753, 9.0820]
      ];
    }
  };

/**
 * Calculate overall health index from NDVI zones
 * @param {Array} zones - NDVI zones
 * @returns {number} - Health index (0-100)
 */
const calculateHealthIndex = (zones) => {
  let totalScore = 0;
  let totalArea = 0;
  
  zones.forEach(zone => {
    let score = 0;
    switch(zone.status) {
      case "Excellent":
        score = 90;
        break;
      case "Good":
        score = 75;
        break;
      case "Fair":
        score = 50;
        break;
      case "Poor":
        score = 25;
        break;
      case "Very Poor":
        score = 10;
        break;
      default:
        score = 0;
    }
    
    totalScore += score * zone.area_percentage;
    totalArea += zone.area_percentage;
  });
  
  return Math.round(totalScore / (totalArea || 1));
};

/**
 * Get overall status based on health index
 * @param {number} healthIndex - Health index (0-100)
 * @returns {string} - Overall status
 */
const getOverallStatus = (healthIndex) => {
  if (healthIndex >= 85) return "Excellent";
  if (healthIndex >= 70) return "Good";
  if (healthIndex >= 50) return "Fair";
  if (healthIndex >= 30) return "Poor";
  return "Very Poor";
};

/**
 * Generate alerts based on NDVI analysis
 * @param {Array} zones - NDVI zones
 * @returns {Array} - Alerts
 */
const generateAlerts = (zones) => {
  const alerts = [];
  
  // Check for stress areas (Fair or worse)
  const stressZones = zones.filter(zone => 
    zone.status === "Fair" || zone.status === "Poor" || zone.status === "Very Poor"
  );
  
  if (stressZones.length > 0) {
    const totalStressArea = stressZones.reduce((sum, zone) => sum + zone.area_percentage, 0);
    
    if (totalStressArea > 20) {
      alerts.push({
        severity: "medium",
        type: "stress",
        description: "Potential water stress in affected sections",
        affected_area_percentage: totalStressArea
      });
    }
  }
  
  return alerts;
};

/**
 * Generate recommendations based on alerts
 * @param {Array} alerts - Alerts
 * @param {string} cropType - Type of crop
 * @param {string} growthStage - Growth stage
 * @returns {Array} - Recommendations
 */
const generateRecommendations = (alerts, cropType, growthStage) => {
  const recommendations = [];
  
  alerts.forEach(alert => {
    if (alert.type === "stress") {
      recommendations.push(`Inspect affected areas for water stress`);
      recommendations.push(`Consider supplemental irrigation for affected area`);
      
      if (growthStage === "vegetative") {
        recommendations.push(`Ensure adequate nitrogen application at this growth stage`);
      }
    }
  });
  
  // If no specific recommendations based on alerts, provide general ones
  if (recommendations.length === 0) {
    recommendations.push(`Continue regular monitoring of crop health`);
    
    if (growthStage === "vegetative") {
      recommendations.push(`Maintain adequate soil moisture for optimal growth`);
    } else if (growthStage === "reproductive") {
      recommendations.push(`Ensure sufficient nutrients for fruit/grain development`);
    }
  }
  
  return recommendations;
};

/**
 * Get eval script for Sentinel Hub
 * @param {string} type - Type of analysis
 * @returns {string} - Eval script
 */
const getEvalScript = (type) => {
  if (type === "health") {
    return `
    //VERSION=3
    let ndvi = (B8A - B04) / (B8A + B04);
    
    if (ndvi<0) return [0.647,0,0.149];
    else if (ndvi<0.1) return [0.843,0.188,0.153];
    else if (ndvi<0.2) return [0.957,0.427,0.263];
    else if (ndvi<0.3) return [0.992,0.682,0.38];
    else if (ndvi<0.4) return [0.996,0.878,0.545];
    else if (ndvi<0.5) return [1,1,0.749];
    else if (ndvi<0.6) return [0.851,0.937,0.545];
    else if (ndvi<0.7) return [0.651,0.851,0.416];
    else if (ndvi<0.8) return [0.40,0.741,0.388];
    else if (ndvi<0.9) return [0.102,0.596,0.314];
    else return [0,0.408,0.216];
    `;
  }
};

module.exports = {
  getCropHealth,
  getFertilizerRecommendation
};