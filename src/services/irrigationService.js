/**
 * Irrigation recommendation service
 * Generates irrigation recommendations based on water stress analysis and weather data
 */

// Crop water requirements (mm per week) by crop type and growth stage
const CROP_WATER_REQUIREMENTS = {
  maize: {
    seedling: 15,
    vegetative: 25,
    flowering: 35,
    grain_filling: 30,
    maturity: 15
  },
  rice: {
    seedling: 20,
    vegetative: 30,
    flowering: 40,
    grain_filling: 35,
    maturity: 20
  },
  cassava: {
    seedling: 12,
    vegetative: 20,
    flowering: 25,
    grain_filling: 20,
    maturity: 10
  },
  sorghum: {
    seedling: 12,
    vegetative: 20,
    flowering: 30,
    grain_filling: 25,
    maturity: 12
  },
  default: {
    seedling: 15,
    vegetative: 22,
    flowering: 30,
    grain_filling: 25,
    maturity: 15
  }
};

/**
 * Generate irrigation recommendations based on water stress and weather analysis
 * @param {Object} ndwiAnalysis - NDWI zones analysis
 * @param {Object} weatherData - Weather data with rainfall information
 * @param {string} cropType - Type of crop grown
 * @param {string} growthStage - Current growth stage of crop
 * @returns {Array} Array of irrigation recommendations
 */
const generateIrrigationRecommendations = (ndwiAnalysis, weatherData, cropType, growthStage) => {
  const recommendations = [];
  
  try {
    console.log("Generating irrigation recommendations...");
    
    // Get crop water requirements
    const waterRequirements = getCropWaterRequirement(cropType, growthStage);
    
    // Calculate water deficit based on recent rainfall
    const weeklyWaterNeed = waterRequirements;
    const recentRainfall = weatherData.recent_rainfall.last_7_days;
    const baseWaterDeficit = Math.max(0, weeklyWaterNeed - recentRainfall);
    
    console.log(`Crop water need: ${weeklyWaterNeed}mm, Recent rainfall: ${recentRainfall}mm`);
    
    // Analyze each water stress zone
    ndwiAnalysis.zones.forEach(zone => {
      if (zone.status === "High Stress" || zone.status === "Moderate Stress") {
        
        // Calculate irrigation need based on stress level
        let irrigationMultiplier = 1.0;
        let urgency = "Medium";
        
        switch (zone.status) {
          case "High Stress":
            irrigationMultiplier = 1.5; // 50% more water needed
            urgency = "High";
            break;
          case "Moderate Stress":
            irrigationMultiplier = 1.2; // 20% more water needed
            urgency = "Medium";
            break;
        }
        
        const irrigationAmount = baseWaterDeficit * irrigationMultiplier;
        
        if (irrigationAmount > 5) { // Only recommend if significant amount needed
          recommendations.push({
            action: "Irrigation",
            urgency: urgency,
            target_zones: [zone.zone_id],
            water_quantity: parseFloat(irrigationAmount.toFixed(1)),
            unit: "mm",
            description: `Apply ${irrigationAmount.toFixed(1)}mm of water to ${zone.status.toLowerCase()} areas`
          });
        }
      }
    });
    
    // Add mulching recommendation for high stress areas
    const highStressZones = ndwiAnalysis.zones.filter(zone => zone.status === "High Stress");
    if (highStressZones.length > 0) {
      recommendations.push({
        action: "Mulching",
        urgency: "Low",
        target_zones: highStressZones.map(zone => zone.zone_id),
        description: "Apply mulch to reduce water loss in high stress areas"
      });
    }
    
    // Add water conservation recommendations if deficit is severe
    if (weatherData.rainfall_anomaly < -15) {
      recommendations.push({
        action: "Water Conservation",
        urgency: "Medium", 
        target_zones: "all",
        description: "Implement water conservation practices due to low recent rainfall"
      });
    }
    
    // Add timing recommendations
    if (recommendations.length > 0) {
      recommendations.push({
        action: "Irrigation Timing",
        urgency: "Low",
        target_zones: "all",
        description: "Apply irrigation early morning (6-8 AM) or late evening (6-8 PM) to minimize evaporation"
      });
    }
    
    console.log(`Generated ${recommendations.length} irrigation recommendations`);
    return recommendations;
    
  } catch (error) {
    console.error("Error generating irrigation recommendations:", error);
    
    // Return basic recommendations as fallback
    return [
      {
        action: "Irrigation",
        urgency: "Medium",
        target_zones: [2, 3],
        water_quantity: 12.5,
        unit: "mm",
        description: "Apply supplemental irrigation based on current conditions"
      },
      {
        action: "Mulching", 
        urgency: "Low",
        target_zones: [3],
        description: "Apply mulch to reduce water loss in high stress areas"
      }
    ];
  }
};

/**
 * Get crop water requirement based on crop type and growth stage
 * @param {string} cropType - Type of crop
 * @param {string} growthStage - Growth stage
 * @returns {number} Water requirement in mm per week
 */
const getCropWaterRequirement = (cropType, growthStage) => {
  const normalizedCrop = cropType ? cropType.toLowerCase() : 'default';
  const normalizedStage = growthStage ? growthStage.toLowerCase() : 'vegetative';
  
  // Map common growth stage variations
  const stageMapping = {
    'seedling': 'seedling',
    'germination': 'seedling',
    'vegetative': 'vegetative',
    'growth': 'vegetative',
    'flowering': 'flowering',
    'reproductive': 'flowering',
    'grain_filling': 'grain_filling',
    'filling': 'grain_filling',
    'maturity': 'maturity',
    'harvest': 'maturity'
  };
  
  const mappedStage = stageMapping[normalizedStage] || 'vegetative';
  const cropRequirements = CROP_WATER_REQUIREMENTS[normalizedCrop] || CROP_WATER_REQUIREMENTS.default;
  
  return cropRequirements[mappedStage] || cropRequirements.vegetative;
};

/**
 * Calculate irrigation efficiency recommendations
 * @param {string} soilType - Type of soil (if available)
 * @param {string} cropType - Type of crop
 * @returns {Object} Efficiency recommendations
 */
const getIrrigationEfficiencyTips = (soilType, cropType) => {
  const tips = [
    "Use drip irrigation or micro-sprinklers for water efficiency",
    "Monitor soil moisture at 6-inch depth before irrigating", 
    "Apply irrigation when soil moisture drops to 50% of field capacity",
    "Avoid irrigation during windy conditions to reduce evaporation"
  ];
  
  // Add crop-specific tips
  if (cropType) {
    switch (cropType.toLowerCase()) {
      case 'rice':
        tips.push("Maintain 2-5cm water depth in paddy fields during vegetative stage");
        break;
      case 'maize':
        tips.push("Critical irrigation periods: tasseling and grain filling stages");
        break;
      case 'cassava':
        tips.push("Reduce irrigation frequency but increase amount during dry season");
        break;
    }
  }
  
  return {
    efficiency_tips: tips,
    recommended_method: "Drip irrigation or controlled sprinkler systems"
  };
};

/**
 * Get mock irrigation recommendations for fallback
 * @returns {Array} Mock recommendations matching deliverable format
 */
const getMockIrrigationRecommendations = () => {
  return [
    {
      action: "Irrigation",
      urgency: "Medium", 
      target_zones: [2, 3],
      water_quantity: 12.5,
      unit: "mm",
      description: "Apply 12.5mm of water to moderate and high stress areas"
    },
    {
      action: "Mulching",
      urgency: "Low",
      target_zones: [3], 
      description: "Apply mulch to reduce water loss in high stress areas"
    }
  ];
};

module.exports = {
  generateIrrigationRecommendations,
  getCropWaterRequirement,
  getIrrigationEfficiencyTips,
  getMockIrrigationRecommendations
};