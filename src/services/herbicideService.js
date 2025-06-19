// src/services/herbicideService.js - Updated database-based service
const AppDataSource = require("../data-source");
const Herbicide = require("../entities/Herbicide");
const HerbicideBrand = require("../entities/HerbicideBrand");
const HerbicideCrop = require("../entities/HerbicideCrop");

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
  if (daysSincePlanting <= 14) return "germination";
  if (daysSincePlanting <= 45) return "vegetative";
  if (daysSincePlanting <= 75) return "reproductive";
  return "maturity";
};

/**
 * Determine application timing based on growth stage
 * @param {string} growthStage - Current growth stage
 * @returns {string} Application timing
 */
const determineApplicationTiming = (growthStage) => {
  const timingMap = {
    "pre-planting": "pre-planting",
    "germination": "pre-emergence",
    "vegetative": "post-emergence",
    "reproductive": "post-emergence",
    "maturity": "pre-harvest"
  };
  
  return timingMap[growthStage] || "post-emergence";
};

/**
 * Assess weed pressure using simple rules
 * @param {Object} farmData - Farm information
 * @param {string} userInput - User provided weed pressure (high/medium/low)
 * @returns {string} Weed pressure level
 */
const assessWeedPressure = (farmData, userInput) => {
  if (userInput && ['high', 'medium', 'low'].includes(userInput.toLowerCase())) {
    return userInput.toLowerCase();
  }
  
  // Simple assessment based on farm size
  const farmSize = farmData.calculated_area || 1;
  
  if (farmSize > 5) return "high"; // Larger farms often have more weed pressure
  if (farmSize > 2) return "medium";
  return "low";
};

/**
 * Parse application rate from string format like "2-4L/ha" or "1.5-3 L/ha"
 * @param {string} rateString - Application rate string
 * @returns {Object} Parsed rate with value and unit
 */
const parseApplicationRate = (rateString) => {
  if (!rateString) return { value: 0, unit: "L" };
  
  // Clean the string
  const cleaned = rateString.replace(/\s+/g, '').toLowerCase();
  
  // Extract numbers (handle ranges by taking the middle value)
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
  
  // Extract unit
  const unit = cleaned.includes('kg') ? 'kg' : 'L';
  
  return { value, unit };
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
    'cassava': 'cassava',
    'soybean': 'legumes',
    'soybeans': 'legumes',
    'soyabeans': 'legumes',
    'groundnut': 'legumes',
    'groundnuts': 'legumes',
    'peanut': 'legumes',
    'peanuts': 'legumes',
    'cowpea': 'legumes',
    'cowpeas': 'legumes'
  };
  
  return cropMapping[normalized] || 'maize';
};

/**
 * Check if herbicide application timing matches the required timing
 * @param {string} herbicideApplicationTime - Herbicide application time from database
 * @param {string} requiredTiming - Required application timing
 * @returns {boolean} Whether herbicide is suitable
 */
const isHerbicideSuitable = (herbicideApplicationTime, requiredTiming) => {
  if (!herbicideApplicationTime || !requiredTiming) return false;
  
  const herbicideTimings = herbicideApplicationTime.toLowerCase();
  const required = requiredTiming.toLowerCase();
  
  // Check if the herbicide supports the required application timing
  return herbicideTimings.includes(required);
};

/**
 * Calculate herbicide quantities based on farm size and weed pressure
 * @param {Object} brand - Herbicide brand data
 * @param {number} farmSizeHectares - Farm size in hectares
 * @param {string} weedPressure - Weed pressure level
 * @returns {Object} Calculated quantities
 */
const calculateHerbicideQuantities = (brand, farmSizeHectares, weedPressure) => {
  const applicationRate = parseApplicationRate(brand.application_rate);
  const dilutionRate = parseApplicationRate(brand.dilution_rate);
  
  // Apply weed pressure multiplier
  const pressureMultipliers = { high: 1.2, medium: 1.0, low: 0.8 };
  const pressureMultiplier = pressureMultipliers[weedPressure] || 1.0;
  
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
 * Get herbicide recommendations from database
 * @param {string} farmId - Farm ID
 * @param {Object} farmData - Farm data
 * @param {Object} requestOptions - Request options from query parameters
 * @returns {Object} Herbicide recommendations
 */
const getHerbicidePesticideRecommendations = async (farmId, farmData, requestOptions = {}) => {
  try {
    console.log(`Generating herbicide recommendations for farm ${farmId}`);
    
    const herbicideRepository = AppDataSource.getRepository(Herbicide);
    const brandRepository = AppDataSource.getRepository(HerbicideBrand);
    const cropRepository = AppDataSource.getRepository(HerbicideCrop);
    
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
    
    // Determine application timing
    const applicationTiming = requestOptions.timing_preference || determineApplicationTiming(growthStage);
    
    // Assess weed pressure
    const weedPressure = assessWeedPressure(farmData, requestOptions.weed_pressure);
    
    console.log(`Parameters: crop=${cropType}, growth_stage=${growthStage}, timing=${applicationTiming}, weed_pressure=${weedPressure}`);
    
    // Get herbicides suitable for this crop
    const suitableHerbicides = await herbicideRepository
      .createQueryBuilder("herbicide")
      .innerJoin("herbicide_crops", "hc", "hc.herbicide_id = herbicide.id")
      .where("hc.crop_type = :cropType", { cropType })
      .getMany();
    
    if (suitableHerbicides.length === 0) {
      throw new Error(`No herbicides found for crop type: ${cropType}`);
    }
    
    console.log(`Found ${suitableHerbicides.length} suitable herbicides`);
    
    const recommendations = [];
    
    // Process each suitable herbicide
    for (const herbicide of suitableHerbicides) {
      // Check if herbicide is suitable for the application timing
      if (!isHerbicideSuitable(herbicide.application_time, applicationTiming)) {
        continue;
      }
      
      // Get available brands for this herbicide
      const brands = await brandRepository.find({
        where: { 
          herbicide_id: herbicide.id,
          is_available: true
        }
      });
      
      if (brands.length === 0) continue;
      
      // Select the first available brand (could be enhanced with preference logic)
      const selectedBrand = brands[0];
      
      // Calculate quantities
      const quantities = calculateHerbicideQuantities(selectedBrand, farmSizeHectares, weedPressure);
      
      // Create recommendation
      const recommendation = {
        herbicide_type: herbicide.name,
        active_ingredient: herbicide.active_ingredient,
        application_timing: applicationTiming,
        recommended_brand: {
          name: selectedBrand.brand_name,
          concentration: selectedBrand.concentration,
          manufacturer: selectedBrand.manufacturer || "Not specified"
        },
        application_details: {
          rate_per_hectare: selectedBrand.application_rate,
          total_quantity: quantities.total_quantity,
          unit: quantities.unit,
          dilution_water: quantities.dilution_water,
          dilution_unit: quantities.dilution_unit,
          total_spray_volume: quantities.total_spray_volume
        },
        timing_instructions: {
          growth_stage: herbicide.growth_stage,
          safety_period_before_harvest: selectedBrand.safety_period,
          optimal_conditions: [
            "Apply during calm weather conditions (wind speed < 5 mph)",
            "Avoid application when rain is expected within 4-6 hours",
            "Best applied during early morning or late evening",
            "Ensure soil moisture is adequate for activation"
          ]
        },
        target_weeds: herbicide.target_weeds,
        mode_of_action: herbicide.mode_of_action,
        spectrum: herbicide.spectrum,
        application_method: herbicide.application_method,
        contraindications: selectedBrand.contraindications || "Follow standard safety guidelines",
        safety_notes: [
          "Use appropriate personal protective equipment (PPE)",
          "Keep away from children and livestock",
          "Do not contaminate water sources",
          "Store in original container in a cool, dry place"
        ]
      };
      
      // Add special notes if available
      if (herbicide.special_notes) {
        recommendation.special_notes = herbicide.special_notes;
      }
      
      recommendations.push(recommendation);
    }
    
    // Sort recommendations by application timing priority
    recommendations.sort((a, b) => {
      const priorityOrder = ['pre-emergence', 'post-emergence', 'pre-planting', 'pre-harvest'];
      const aPriority = priorityOrder.indexOf(a.application_timing);
      const bPriority = priorityOrder.indexOf(b.application_timing);
      return aPriority - bPriority;
    });
    
    // Get alternative brands for selected herbicides
    const alternatives = await getAlternativeBrands(recommendations, herbicideRepository, brandRepository);
    
    console.log(`Generated ${recommendations.length} herbicide recommendations`);
    
    return {
      farm_id: farmId,
      crop: farmData.crop_type || "Unknown",
      growth_stage: growthStage,
      farm_size_hectares: parseFloat(farmSizeHectares.toFixed(2)),
      weed_pressure: weedPressure,
      recommendations: {
        herbicides: recommendations,
        alternatives: alternatives,
        application_guidelines: getApplicationGuidelines(cropType),
        safety_guidelines: getSafetyGuidelines()
      },
      pesticides: [], // Placeholder for future pesticide implementation
      data_source: "agricultural_extension_database",
      generated_at: new Date().toISOString()
    };
    
  } catch (error) {
    console.error("Error generating herbicide recommendations:", error);
    throw new Error(`Failed to generate recommendations: ${error.message}`);
  }
};

/**
 * Get alternative brands for recommended herbicides
 * @param {Array} recommendations - Current recommendations
 * @param {Object} herbicideRepository - Herbicide repository
 * @param {Object} brandRepository - Brand repository
 * @returns {Array} Alternative brand options
 */
const getAlternativeBrands = async (recommendations, herbicideRepository, brandRepository) => {
  const alternatives = [];
  
  for (const rec of recommendations) {
    // Find the herbicide by name
    const herbicide = await herbicideRepository.findOne({
      where: { name: rec.herbicide_type }
    });
    
    if (herbicide) {
      // Get all other brands for this herbicide
      const allBrands = await brandRepository.find({
        where: { 
          herbicide_id: herbicide.id,
          is_available: true
        }
      });
      
      // Filter out the currently recommended brand
      const alternativeBrands = allBrands.filter(
        brand => brand.brand_name !== rec.recommended_brand.name
      );
      
      alternativeBrands.forEach(brand => {
        alternatives.push({
          herbicide_type: rec.herbicide_type,
          alternative_brand: brand.brand_name,
          concentration: brand.concentration,
          manufacturer: brand.manufacturer || "Not specified",
          reason: "Alternative brand for same active ingredient"
        });
      });
    }
  }
  
  return alternatives;
};

/**
 * Get application guidelines for specific crop
 * @param {string} cropType - Crop type
 * @returns {Array} Application guidelines
 */
const getApplicationGuidelines = (cropType) => {
  const guidelines = {
    maize: [
      "Calibrate spraying equipment before application",
      "Ensure uniform coverage for best results",
      "Monitor weather conditions closely",
      "Consider tank mixing only with compatible products",
      "Follow crop rotation guidelines to prevent resistance"
    ],
    rice: [
      "Maintain proper water levels in paddy fields",
      "Apply when weather conditions are stable",
      "Consider field drainage requirements",
      "Monitor for herbicide drift to adjacent crops"
    ],
    cassava: [
      "Use directed spraying to avoid contact with crop shoots",
      "Consider manual weeding for areas close to plants",
      "Apply during dry conditions for best efficacy"
    ],
    legumes: [
      "Be cautious with application timing to protect nodulation",
      "Consider crop sensitivity during flowering stage",
      "Use lower rates for sensitive varieties"
    ]
  };
  
  return guidelines[cropType] || guidelines.maize;
};

/**
 * Get general safety guidelines
 * @returns {Array} Safety guidelines
 */
const getSafetyGuidelines = () => {
  return [
    "Apply herbicides when soil is moist but not waterlogged",
    "Apply pesticides in the early morning or late evening to minimize bee exposure",
    "Ensure proper calibration of spraying equipment",
    "Follow all safety guidelines and use appropriate PPE",
    "Keep records of all applications for future reference",
    "Do not apply near water sources or during windy conditions"
  ];
};

module.exports = {
  getHerbicidePesticideRecommendations,
  calculateGrowthStageFromDate,
  assessWeedPressure,
  normalizeCropType
};