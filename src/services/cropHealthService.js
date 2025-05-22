const axios = require("axios");
const { getSentinelToken, extractCoordinates } = require("./satelliteService");
const { processNDVIImage } = require("./imageProcessingService");

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
    const token = await getSentinelToken();
    
    console.log(`Coordinates for API request: ${JSON.stringify(coordinates)}`);
    
    if (!coordinates || coordinates.length < 3) {
      throw new Error("Invalid coordinates: need at least 3 points for a polygon");
    }
    
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
    
    console.log("Processing image data...");
    const ndviAnalysis = await processNDVIImage(response.data, farmSize);
    console.log("NDVI analysis successful");
    return ndviAnalysis;
  } catch (error) {
    console.error("Error getting NDVI data:", error);
    
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
        area_hectares: farmSize * 0.354 * 0.404686
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
  return "vegetative";
};

module.exports = {
  getNDVIAnalysis,
  calculateHealthIndex,
  getOverallStatus,
  generateAlerts,
  generateRecommendations,
  getMockNdviAnalysis,
  calculateGrowthStage
};