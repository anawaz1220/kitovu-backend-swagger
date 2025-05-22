const axios = require("axios");
const { FR_DATA, COMMERCIAL_FERTILIZERS } = require("../utils/fertilizerData");
const { classifyNutrientStatus } = require("../utils/soilClassification");
const { getCommentaryForDeficiency } = require("../utils/fertilizerCommentary");

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

module.exports = {
  getISDASoilData,
  calculateFertilizerRequirements,
  calculateApplicationSchedule,
  generateCommercialProducts,
  getMockSoilAnalysis
};