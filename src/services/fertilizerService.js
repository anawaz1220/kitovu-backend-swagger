// Enhanced fertilizerService.js with vegetation health integration

const axios = require("axios");
const { FR_DATA, COMMERCIAL_FERTILIZERS } = require("../utils/fertilizerData");
const { classifyNutrientStatus } = require("../utils/soilClassification");
const { getCommentaryForDeficiency } = require("../utils/fertilizerCommentary");
const { getNDVIAnalysis } = require("./cropHealthService");
const { extractCoordinates } = require("./satelliteService");

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
    const depth = "0-20";
    
    const url = `https://api.isda-africa.com/v1/soilproperty?key=${isdaApiKey}&lat=${lat}&lon=${lng}&property=${elementName}&depth=${depth}`;
    
    console.log(`ISDA API URL: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
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
  
  const nRequirement = composition.find(c => c.type.toLowerCase() === 'nitrogen')?.quantity || 0;
  const pRequirement = composition.find(c => c.type.toLowerCase() === 'phosphorous')?.quantity || 0;
  const kRequirement = composition.find(c => c.type.toLowerCase() === 'potassium')?.quantity || 0;
  
  console.log(`NPK Requirements - N: ${nRequirement}, P: ${pRequirement}, K: ${kRequirement}`);
  
  if (nRequirement > 0 || pRequirement > 0 || kRequirement > 0) {
    const npk1515 = COMMERCIAL_FERTILIZERS.compound.find(f => f.name === "NPK 15-15-15");
    if (npk1515) {
      const npkQuantity = Math.max(
        nRequirement / (npk1515.composition.N / 100),
        pRequirement / (npk1515.composition.P / 100),
        kRequirement / (npk1515.composition.K / 100)
      );
      
      products.push({
        name: npk1515.name,
        quantity: parseFloat(Math.min(npkQuantity, totalQuantity * 0.7).toFixed(2)),
        unit: "kg"
      });
    }
  }
  
  if (nRequirement > 0) {
    const urea = COMMERCIAL_FERTILIZERS.nitrogen.find(f => f.name === "Urea");
    if (urea) {
      const remainingN = nRequirement * 0.4;
      const ureaNeed = remainingN / (urea.composition.N / 100);
      
      if (ureaNeed > 10) {
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
 * Calculate percentage of farm area under vegetation stress
 * @param {Array} zones - NDVI zones from vegetation analysis
 * @returns {number} - Percentage of stressed areas
 */
const calculateStressedAreasPercentage = (zones) => {
  return zones
    .filter(zone => zone.status === 'Fair' || zone.status === 'Poor' || zone.status === 'Very Poor')
    .reduce((sum, zone) => sum + zone.area_percentage, 0);
};

/**
 * Get overall health status from NDVI value
 * @param {number} avgNDVI - Average NDVI value
 * @returns {string} - Health status
 */
const getOverallHealthStatus = (avgNDVI) => {
  if (avgNDVI >= 0.8) return "Excellent";
  if (avgNDVI >= 0.6) return "Good";
  if (avgNDVI >= 0.4) return "Fair";
  if (avgNDVI >= 0.2) return "Poor";
  return "Very Poor";
};

/**
 * Generate zone-specific fertilizer recommendations
 * @param {Array} zones - NDVI zones
 * @returns {Array} - Zone-specific recommendations
 */
const generateZoneSpecificRecommendations = (zones) => {
  return zones.map(zone => {
    let recommendation = "";
    let priority = "Low";
    
    switch(zone.status) {
      case "Very Poor":
        recommendation = "Immediate intervention required - apply nitrogen fertilizer and investigate drainage issues";
        priority = "High";
        break;
      case "Poor":
        recommendation = "Apply balanced NPK fertilizer with emphasis on nitrogen for chlorophyll development";
        priority = "High";
        break;
      case "Fair":
        recommendation = "Monitor closely and consider targeted nutrient application";
        priority = "Medium";
        break;
      case "Good":
      case "Excellent":
        recommendation = "Maintain current fertility levels with standard application rates";
        priority = "Low";
        break;
    }
    
    return {
      zone_id: zone.zone_id,
      area_percentage: zone.area_percentage,
      area_hectares: zone.area_hectares,
      health_status: zone.status,
      recommendation: recommendation,
      priority: priority
    };
  });
};

/**
 * Calculate fertilizer adjustments based on vegetation health indicators
 * @param {Object} vegetationHealth - NDVI analysis results
 * @param {string} nutrientKey - Specific nutrient being analyzed
 * @returns {Object} - Adjustment multiplier and reason
 */
const calculateVegetationHealthAdjustment = (vegetationHealth, nutrientKey) => {
  const avgNDVI = vegetationHealth.average_ndvi;
  const stressedPercentage = calculateStressedAreasPercentage(vegetationHealth.zones);
  
  let multiplier = 1.0;
  let reason = "";
  
  // Nitrogen adjustments based on chlorophyll content (NDVI correlation)
  if (nutrientKey === 'nitrogen_total') {
    if (avgNDVI < 0.4) {
      multiplier = 1.3; // Increase nitrogen by 30%
      reason = "Low vegetation vigor detected - increased nitrogen recommended for chlorophyll synthesis";
    } else if (avgNDVI < 0.6 && stressedPercentage > 25) {
      multiplier = 1.15; // Increase nitrogen by 15%
      reason = "Moderate vegetation stress in some areas - slight nitrogen increase recommended";
    } else if (avgNDVI > 0.8) {
      multiplier = 0.9; // Reduce nitrogen by 10%
      reason = "Excellent vegetation health - reduced nitrogen to avoid over-fertilization";
    }
  }
  
  // Phosphorus adjustments for poor vegetation development
  if (nutrientKey === 'phosphorous_extractable') {
    if (avgNDVI < 0.3) {
      multiplier = 1.2; // Increase phosphorus by 20%
      reason = "Very poor vegetation development - increased phosphorus for root development";
    } else if (stressedPercentage > 30) {
      multiplier = 1.1; // Increase phosphorus by 10%
      reason = "Vegetation stress detected - phosphorus boost for plant energy";
    }
  }
  
  // Potassium adjustments for plant stress tolerance
  if (nutrientKey === 'potassium_extractable') {
    if (stressedPercentage > 20) {
      multiplier = 1.15; // Increase potassium by 15%
      reason = "Plant stress indicators detected - increased potassium for stress tolerance";
    }
  }
  
  return { multiplier, reason };
};

/**
 * Enhanced fertilizer calculation that incorporates both soil analysis and vegetation health
 * @param {Object} soilAnalysis - Soil nutrient analysis from ISDA
 * @param {Object} vegetationHealth - NDVI analysis from satellite imagery
 * @param {string} cropType - Type of crop
 * @param {number} farmSize - Farm size in hectares
 * @returns {Object} - Enhanced fertilizer recommendations
 */
const calculateEnhancedFertilizerRequirements = (soilAnalysis, vegetationHealth, cropType, farmSize) => {
  console.log(`Calculating enhanced fertilizer requirements incorporating vegetation health`);
  
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

  // Base calculations from soil analysis
  Object.keys(soilAnalysis).forEach(nutrientKey => {
    const nutrient = soilAnalysis[nutrientKey];
    if (nutrient.status && cropData[nutrientKey]) {
      let requiredPerHectare = cropData[nutrientKey][nutrient.status] || 0;
      
      // Apply vegetation health adjustments
      const healthAdjustment = calculateVegetationHealthAdjustment(vegetationHealth, nutrientKey);
      requiredPerHectare = requiredPerHectare * healthAdjustment.multiplier;
      
      const totalRequired = requiredPerHectare * farmSize;
      
      console.log(`${nutrientKey}: Soil status=${nutrient.status}, Base requirement=${cropData[nutrientKey][nutrient.status]}, Health adjustment=${healthAdjustment.multiplier}, Final=${totalRequired}`);
      
      totalFertilizerQuantity += totalRequired;
      
      if (totalRequired > 0) {
        composition.push({
          type: nutrient.name.charAt(0).toUpperCase() + nutrient.name.slice(1),
          quantity: parseFloat(totalRequired.toFixed(2)),
          unit: "kg",
          adjustment_reason: healthAdjustment.reason
        });
        
        // Enhanced commentary including vegetation insights
        const deficiencyCommentary = getCommentaryForDeficiency(nutrient.name, nutrient.status);
        if (deficiencyCommentary) {
          commentary += deficiencyCommentary + " ";
        }
        
        if (healthAdjustment.reason) {
          commentary += healthAdjustment.reason + " ";
        }
      }
    }
  });

  // Add zone-specific recommendations based on vegetation health zones
  const zoneSpecificRecommendations = generateZoneSpecificRecommendations(vegetationHealth.zones);

  return {
    total_fertilizer_quantity: parseFloat(totalFertilizerQuantity.toFixed(2)),
    composition: composition,
    commentary: commentary.trim(),
    vegetation_insights: {
      overall_health_status: getOverallHealthStatus(vegetationHealth.average_ndvi),
      average_ndvi: vegetationHealth.average_ndvi,
      stressed_areas_percentage: calculateStressedAreasPercentage(vegetationHealth.zones),
      zone_specific_recommendations: zoneSpecificRecommendations
    }
  };
};

/**
 * Enhanced fertilizer recommendation function that combines soil and vegetation data
 * @param {Object} farm - Farm data
 * @param {number} farmSizeHectares - Farm size in hectares
 * @returns {Object} - Complete fertilizer recommendations
 */
const getEnhancedFertilizerRecommendations = async (farm, farmSizeHectares) => {
  try {
    console.log("Starting enhanced fertilizer analysis combining soil and vegetation data...");
    
    // Extract coordinates for analysis
    const coordinates = extractCoordinates(null, farm);
    const centerLat = coordinates.length > 0 ? coordinates[0][1] : farm.farm_latitude;
    const centerLng = coordinates.length > 0 ? coordinates[0][0] : farm.farm_longitude;
    
    // Set up date range for vegetation analysis (last 30 days)
    const endDate = new Date().toISOString();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    // Get both soil data and vegetation health in parallel
    const [soilDataResults, vegetationHealth] = await Promise.all([
      // Soil analysis (existing functionality)
      Promise.all([
        "nitrogen_total",
        "phosphorous_extractable", 
        "potassium_extractable",
        "magnesium_extractable",
        "calcium_extractable",
        "sulphur_extractable",
        "iron_extractable"
      ].map(nutrient => getISDASoilData(centerLat, centerLng, nutrient))),
      
      // Vegetation health analysis
      getNDVIAnalysis(
        farm.calculated_area || 1,
        coordinates,
        startDate.toISOString(),
        endDate,
        farm.crop_type
      )
    ]);
    
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
      } else {
        // Use default values for failed requests
        soilAnalysis[result.elementName] = {
          status: "Medium",
          value: 0,
          unit: "mg/kg",
          name: result.elementName.split("_")[0]
        };
      }
    });
    
    // Calculate enhanced fertilizer requirements
    const fertilizerCalc = calculateEnhancedFertilizerRequirements(
      soilAnalysis, 
      vegetationHealth,
      farm.crop_type || "maize", 
      farmSizeHectares
    );
    
    // Generate application schedule and commercial products (existing functionality)
    const applicationSchedule = calculateApplicationSchedule(
      fertilizerCalc.total_fertilizer_quantity,
      farm.crop_type || "maize"
    );
    
    const commercialProducts = generateCommercialProducts(
      fertilizerCalc.composition,
      fertilizerCalc.total_fertilizer_quantity
    );
    
    return {
      soil_analysis: soilAnalysis,
      vegetation_analysis: {
        average_ndvi: vegetationHealth.average_ndvi,
        health_zones: vegetationHealth.zones,
        overall_health: getOverallHealthStatus(vegetationHealth.average_ndvi)
      },
      recommendations: {
        total_fertilizer_quantity: fertilizerCalc.total_fertilizer_quantity,
        unit: "kg",
        composition: fertilizerCalc.composition,
        application_schedule: applicationSchedule
      },
      vegetation_insights: fertilizerCalc.vegetation_insights,
      commercial_products: commercialProducts,
      commentary: fertilizerCalc.commentary,
      data_source: "integrated_soil_and_vegetation"
    };
    
  } catch (error) {
    console.error("Error in enhanced fertilizer analysis:", error);
    throw error;
  }
};

module.exports = {
  getISDASoilData,
  calculateFertilizerRequirements,
  calculateApplicationSchedule,
  generateCommercialProducts,
  getMockSoilAnalysis,
  calculateEnhancedFertilizerRequirements,
  getEnhancedFertilizerRecommendations,
  calculateStressedAreasPercentage,
  getOverallHealthStatus,
  generateZoneSpecificRecommendations,
  calculateVegetationHealthAdjustment
};