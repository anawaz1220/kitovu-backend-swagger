// src/services/pesticideService.js
const AppDataSource = require("../data-source");
const Pesticide = require("../entities/Pesticide");
const PesticideBrand = require("../entities/PesticideBrand");
const PesticideCrop = require("../entities/PesticideCrop");
const PesticideTarget = require("../entities/PesticideTarget");

/**
 * Assess pest pressure based on various factors
 * @param {Object} farmData - Farm information
 * @param {string} userInput - User provided pest pressure (high/medium/low)
 * @param {string} cropType - Crop type
 * @param {string} growthStage - Current growth stage
 * @returns {string} Pest pressure level
 */
const assessPestPressure = (farmData, userInput, cropType, growthStage) => {
  // If user provided explicit input, use it
  if (userInput && ['high', 'medium', 'low'].includes(userInput.toLowerCase())) {
    return userInput.toLowerCase();
  }
  
  let pressureScore = 0;
  
  // Farm size factor (larger farms = more pest pressure)
  const farmSize = farmData.calculated_area || 1;
  if (farmSize > 10) pressureScore += 2;
  else if (farmSize > 5) pressureScore += 1;
  
  // Crop type factor (some crops more susceptible)
  const highRiskCrops = ['tomato', 'pepper', 'rice'];
  const mediumRiskCrops = ['maize', 'legumes'];
  
  if (highRiskCrops.includes(cropType?.toLowerCase())) pressureScore += 2;
  else if (mediumRiskCrops.includes(cropType?.toLowerCase())) pressureScore += 1;
  
  // Growth stage factor (vegetative stage often has higher pest pressure)
  if (growthStage === 'vegetative' || growthStage === 'reproductive') {
    pressureScore += 1;
  }
  
  // Season factor (assume higher pressure during growing season)
  const currentMonth = new Date().getMonth() + 1; // 1-12
  if (currentMonth >= 4 && currentMonth <= 10) { // April to October
    pressureScore += 1;
  }
  
  // Convert score to pressure level
  if (pressureScore >= 4) return 'high';
  if (pressureScore >= 2) return 'medium';
  return 'low';
};

/**
 * Calculate growth stage from planting date
 * @param {string} plantingDate - Planting date in YYYY-MM-DD format
 * @param {string} cropType - Type of crop
 * @returns {string} Growth stage
 */
const calculateGrowthStageFromDate = (plantingDate, cropType) => {
  if (!plantingDate) return null;
  
  const planted = new Date(plantingDate);
  const now = new Date();
  const daysSincePlanting = Math.floor((now - planted) / (1000 * 60 * 60 * 24));
  
  if (daysSincePlanting < 0) return "pre-planting";
  
  // Adjust timing based on crop type
  const cropTimings = {
    'tomato': { germination: 10, vegetative: 35, reproductive: 70 },
    'pepper': { germination: 12, vegetative: 40, reproductive: 75 },
    'maize': { germination: 14, vegetative: 45, reproductive: 75 },
    'rice': { germination: 21, vegetative: 60, reproductive: 90 },
    'legumes': { germination: 7, vegetative: 35, reproductive: 60 }
  };
  
  const timing = cropTimings[cropType?.toLowerCase()] || cropTimings['maize'];
  
  if (daysSincePlanting <= timing.germination) return "germination";
  if (daysSincePlanting <= timing.vegetative) return "vegetative";
  if (daysSincePlanting <= timing.reproductive) return "reproductive";
  return "maturity";
};

/**
 * Determine optimal application timing based on growth stage and pest type
 * @param {string} growthStage - Current growth stage
 * @param {string} pestType - Type of pest targeted
 * @returns {string} Application timing
 */
const determineApplicationTiming = (growthStage, pestType = 'general') => {
  const timingMap = {
    "pre-planting": "soil_treatment",
    "germination": "early_vegetative",
    "vegetative": "mid_vegetative",
    "reproductive": "flowering_stage",
    "maturity": "pre_harvest"
  };
  
  return timingMap[growthStage] || "mid_vegetative";
};

/**
 * Parse application rate from string format
 * @param {string} rateString - Application rate string like "0.5-1.5L/ha"
 * @returns {Object} Parsed rate with value and unit
 */
const parseApplicationRate = (rateString) => {
  if (!rateString) return { value: 0, unit: "L" };
  
  const cleaned = rateString.replace(/\s+/g, '').toLowerCase();
  const numbers = cleaned.match(/[\d.]+/g);
  
  let value = 0;
  if (numbers && numbers.length >= 1) {
    if (numbers.length === 1) {
      value = parseFloat(numbers[0]);
    } else {
      // Take average of range
      value = (parseFloat(numbers[0]) + parseFloat(numbers[1])) / 2;
    }
  }
  
  const unit = cleaned.includes('kg') ? 'kg' : 'L';
  return { value, unit };
};

/**
 * Calculate pesticide quantities based on farm size and pest pressure
 * @param {Object} brand - Pesticide brand data
 * @param {number} farmSizeHectares - Farm size in hectares
 * @param {string} pestPressure - Pest pressure level
 * @returns {Object} Calculated quantities
 */
const calculatePesticideQuantities = (brand, farmSizeHectares, pestPressure) => {
  const applicationRate = parseApplicationRate(brand.application_rate);
  const dilutionRate = parseApplicationRate(brand.dilution_rate);
  
  // Apply pest pressure multiplier
  const pressureMultipliers = { high: 1.3, medium: 1.0, low: 0.8 };
  const pressureMultiplier = pressureMultipliers[pestPressure] || 1.0;
  
  const adjustedRate = applicationRate.value * pressureMultiplier;
  const totalQuantity = adjustedRate * farmSizeHectares;
  const totalDilutionWater = dilutionRate.value * farmSizeHectares;
  
  return {
    total_quantity: parseFloat(totalQuantity.toFixed(2)),
    unit: applicationRate.unit,
    dilution_water: parseFloat(totalDilutionWater.toFixed(1)),
    dilution_unit: "L",
    total_spray_volume: parseFloat((totalQuantity + totalDilutionWater).toFixed(1))
  };
};

/**
 * Normalize crop type to match database values
 * @param {string} cropType - Input crop type
 * @returns {string} Normalized crop type
 */
const normalizeCropType = (cropType) => {
  if (!cropType) return 'maize';
  
  const normalized = cropType.toLowerCase().trim();
  const cropMapping = {
    'maize': 'maize',
    'corn': 'maize',
    'rice': 'rice',
    'tomato': 'tomato',
    'tomatoes': 'tomato',
    'pepper': 'pepper',
    'peppers': 'pepper',
    'cowpea': 'legumes',
    'cowpeas': 'legumes',
    'legumes': 'legumes',
    'beans': 'legumes'
  };
  
  return cropMapping[normalized] || 'maize';
};

/**
 * Get pesticide recommendations from database
 * @param {string} farmId - Farm ID
 * @param {Object} farmData - Farm data
 * @param {Object} requestOptions - Request options from query parameters
 * @returns {Array} Pesticide recommendations
 */
const getPesticideRecommendations = async (farmId, farmData, requestOptions = {}) => {
  try {
    console.log(`Generating pesticide recommendations for farm ${farmId}`);
    
    const pesticideRepository = AppDataSource.getRepository(Pesticide);
    const brandRepository = AppDataSource.getRepository(PesticideBrand);
    const cropRepository = AppDataSource.getRepository(PesticideCrop);
    const targetRepository = AppDataSource.getRepository(PesticideTarget);
    
    // Extract and normalize parameters
    const cropType = normalizeCropType(farmData.crop_type);
    const farmSizeHectares = (farmData.calculated_area || 1) * 0.404686; // Convert acres to hectares
    
    // Determine growth stage
    let growthStage = requestOptions.growth_stage;
    if (!growthStage && requestOptions.planting_date) {
      growthStage = calculateGrowthStageFromDate(requestOptions.planting_date, cropType);
    }
    if (!growthStage) {
      growthStage = "vegetative"; // Default fallback
    }
    
    // Assess pest pressure
    const pestPressure = assessPestPressure(farmData, requestOptions.pest_pressure, cropType, growthStage);
    
    console.log(`Parameters: crop=${cropType}, growth_stage=${growthStage}, pest_pressure=${pestPressure}`);
    
    // Get pesticides suitable for this crop
    const suitablePesticides = await pesticideRepository
      .createQueryBuilder("pesticide")
      .innerJoin("pesticide_crops", "pc", "pc.pesticide_id = pesticide.id")
      .where("pc.crop_type = :cropType", { cropType })
      .getMany();
    
    if (suitablePesticides.length === 0) {
      console.warn(`No pesticides found for crop type: ${cropType}`);
      return [];
    }
    
    console.log(`Found ${suitablePesticides.length} suitable pesticides`);
    
    const recommendations = [];
    
    // Process each suitable pesticide
    for (const pesticide of suitablePesticides) {
      // Get available brands for this pesticide
      const brands = await brandRepository.find({
        where: { 
          pesticide_id: pesticide.id,
          is_available: true
        }
      });
      
      if (brands.length === 0) continue;
      
      // Select the first available brand (could be enhanced with preference logic)
      const selectedBrand = brands[0];
      
      // Get target pests for this pesticide
      const targets = await targetRepository.find({
        where: { 
          pesticide_id: pesticide.id,
          target_type: 'pest'
        }
      });
      
      // Calculate quantities
      const quantities = calculatePesticideQuantities(selectedBrand, farmSizeHectares, pestPressure);
      
      // Create recommendation
      const recommendation = {
        target_pest: targets.length > 0 ? targets.map(t => t.target_name).join(', ') : pesticide.target_pests,
        pesticide_type: pesticide.name,
        active_ingredient: pesticide.active_ingredient,
        product_name: selectedBrand.brand_name,
        manufacturer: selectedBrand.manufacturer || "Not specified",
        concentration: selectedBrand.concentration,
        application_rate: parseFloat(quantities.total_quantity),
        unit: quantities.unit,
        total_quantity: quantities.total_quantity,
        timing: getApplicationTiming(growthStage, pesticide.growth_stage),
        application_method: pesticide.application_method || "Foliar spray",
        dilution_details: {
          water_needed: quantities.dilution_water,
          water_unit: quantities.dilution_unit,
          total_spray_volume: quantities.total_spray_volume
        },
        safety_period: selectedBrand.safety_period_before_harvest || "Follow manufacturer guidelines",
        spectrum_of_control: pesticide.spectrum_of_control || "Broad spectrum",
        contraindications: selectedBrand.contraindications || "Follow standard safety guidelines",
        pest_pressure_adjustment: pestPressure,
        efficacy_rating: targets.length > 0 ? Math.round(targets.reduce((sum, t) => sum + t.efficacy_rating, 0) / targets.length) : 7
      };
      
      recommendations.push(recommendation);
    }
    
    // Sort recommendations by efficacy rating (highest first)
    recommendations.sort((a, b) => (b.efficacy_rating || 0) - (a.efficacy_rating || 0));
    
    // Limit to top 3 recommendations
    const topRecommendations = recommendations.slice(0, 3);
    
    console.log(`Generated ${topRecommendations.length} pesticide recommendations`);
    
    return topRecommendations;
    
  } catch (error) {
    console.error("Error generating pesticide recommendations:", error);
    throw new Error(`Failed to generate pesticide recommendations: ${error.message}`);
  }
};

/**
 * Get application timing description
 * @param {string} currentStage - Current growth stage
 * @param {string} recommendedStage - Recommended application stage
 * @returns {string} Timing description
 */
const getApplicationTiming = (currentStage, recommendedStage) => {
  if (recommendedStage) {
    return recommendedStage;
  }
  
  const timingMap = {
    "germination": "Early post-emergence (7-14 days after germination)",
    "vegetative": "Mid-vegetative growth stage",
    "reproductive": "During flowering/reproductive stage", 
    "maturity": "Pre-harvest application (follow safety period)"
  };
  
  return timingMap[currentStage] || "At first signs of pest infestation";
};

/**
 * Get mock pesticide recommendations for fallback
 * @param {string} cropType - Crop type
 * @param {number} farmSizeHectares - Farm size in hectares
 * @returns {Array} Mock recommendations
 */
const getMockPesticideRecommendations = (cropType, farmSizeHectares) => {
  const mockData = {
    maize: {
      target_pest: "Fall Armyworm",
      product_name: "Emamectin benzoate",
      application_rate: 0.3 * farmSizeHectares
    },
    tomato: {
      target_pest: "Tuta absoluta",
      product_name: "Lambda-cyhalothrin", 
      application_rate: 0.5 * farmSizeHectares
    },
    rice: {
      target_pest: "Stem borer",
      product_name: "Chlorpyrifos",
      application_rate: 1.0 * farmSizeHectares
    }
  };
  
  const mock = mockData[cropType] || mockData.maize;
  
  return [{
    target_pest: mock.target_pest,
    product_name: mock.product_name,
    application_rate: parseFloat(mock.application_rate.toFixed(2)),
    unit: "L/ha",
    total_quantity: parseFloat(mock.application_rate.toFixed(2)),
    timing: "At first signs of infestation"
  }];
};

module.exports = {
  getPesticideRecommendations,
  assessPestPressure,
  calculateGrowthStageFromDate,
  normalizeCropType,
  getMockPesticideRecommendations
};