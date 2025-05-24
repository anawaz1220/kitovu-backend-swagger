const axios = require("axios");
const Jimp = require("jimp");

// NDWI color legend from agent.js - mapped to stress levels
const legend_ndwi = [
  [242, 201, 0],   // High stress (yellow)
  [0, 255, 164],   // Moderate stress (light green)  
  [0, 119, 204],   // Low stress (blue)
  [178, 0, 255],   // Very low stress (purple)
];

// NDWI zone classifications matching deliverable format
const NDWI_CLASSIFICATIONS = [
  { range: "High Stress", ndwi_range: "-0.1-0.1", status: "High Stress" },
  { range: "Moderate Stress", ndwi_range: "0.1-0.2", status: "Moderate Stress" },
  { range: "Low Stress", ndwi_range: "0.2-0.3", status: "Low Stress" },
  { range: "Very Low Stress", ndwi_range: "0.3+", status: "Very Low Stress" }
];

/**
 * Get NDWI (Normalized Difference Water Index) analysis for water stress assessment
 * @param {number} farmSize - Farm size in acres
 * @param {Array} coordinates - Farm boundary coordinates
 * @param {string} startDate - Start date for satellite imagery
 * @param {string} endDate - End date for satellite imagery
 * @param {string} cropType - Type of crop grown
 * @returns {Object} NDWI analysis with zones
 */
const getNDWIAnalysis = async (farmSize, coordinates, startDate, endDate, cropType) => {
  try {
    console.log("Starting NDWI analysis for water stress assessment...");
    console.log(`Date range: ${startDate} to ${endDate}`);
    console.log(`Coordinates: ${JSON.stringify(coordinates)}`);
    
    // Validate coordinates
    if (!coordinates || coordinates.length === 0) {
      throw new Error("No valid coordinates provided for NDWI analysis");
    }
    
    // Get Sentinel Hub token
    const token = await getSentinelToken();
    
    // Prepare coordinates for Sentinel Hub API (needs to be closed polygon)
    const polygonCoords = [...coordinates];
    if (polygonCoords.length > 0) {
      polygonCoords.push(polygonCoords[0]); // Close the polygon
    }
    
    // Request satellite imagery with NDWI calculation
    const requestData = {
      input: {
        bounds: {
          geometry: {
            type: "Polygon",
            coordinates: [polygonCoords]
          }
        },
        data: [{
          dataFilter: {
            timeRange: {
              from: startDate,
              to: endDate
            }
          },
          type: "sentinel-2-l2a"
        }]
      },
      evalscript: getNDWIEvalScript(),
      format: {
        type: "image/jpeg"
      }
    };
    
    console.log("Requesting NDWI satellite imagery...");
    
    // Create axios instance without default headers
    const axiosInstance = axios.create({
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });
    
    // Remove default Accept header
    delete axiosInstance.defaults.headers.common['Accept'];
    
    const response = await axiosInstance.post(
      "https://services.sentinel-hub.com/api/v1/process",
      requestData,
      {
        responseType: "arraybuffer"
      }
    );
    
    // Process the satellite image
    const imageBuffer = Buffer.from(response.data);
    const zones = await processNDWIImage(imageBuffer, farmSize);
    
    console.log("NDWI analysis completed successfully");
    return zones;
    
  } catch (error) {
    console.error("Error in NDWI analysis:", error.message);
    
    // Log the specific error details if it's a 400 error
    if (error.response && error.response.status === 400) {
      console.error("Sentinel Hub 400 Error Details:", error.response.data.toString());
    }
    
    throw error;
  }
};

/**
 * Get Sentinel Hub authentication token (reused from existing implementation)
 */
const getSentinelToken = async () => {
  try {
    const response = await axios.post(
      "https://services.sentinel-hub.com/oauth/token",
      "grant_type=client_credentials",
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${Buffer.from(
            `${process.env.SENTINEL_HUB_CLIENT_ID}:${process.env.SENTINEL_HUB_CLIENT_SECRET}`
          ).toString("base64")}`
        }
      }
    );
    
    return response.data.access_token;
  } catch (error) {
    console.error("Error getting Sentinel Hub token:", error);
    throw new Error("Failed to authenticate with Sentinel Hub");
  }
};

/**
 * NDWI evaluation script for Sentinel Hub - ported from agent.js
 * Calculates Normalized Difference Water Index using bands B03 (Green) and B08 (NIR)
 */
const getNDWIEvalScript = () => {
  return `
    //VERSION=3
    let ndwi = (B03 - B08) / (B03 + B08);
    
    if (ndwi < -0.31) return [0.949, 0.788, 0];      // High stress (yellow)
    else if (ndwi < 0.1) return [0, 1, 0.643];       // Moderate stress (light green)
    else if (ndwi < 0.21) return [0, 0.467, 0.8];    // Low stress (blue)  
    else if (ndwi < 1) return [0.698, 0, 1];         // Very low stress (purple)
    else return [0, 0.408, 0.216];                   // Default
  `;
};

/**
 * Process NDWI satellite image to calculate water stress zones
 * @param {Buffer} imageBuffer - Satellite image data
 * @param {number} farmSize - Farm size in acres
 * @returns {Object} Water stress zone analysis
 */
const processNDWIImage = async (imageBuffer, farmSize) => {
  try {
    console.log("Processing NDWI satellite image...");
    
    // Initialize zone counters for each stress level
    const zones = new Array(legend_ndwi.length).fill(0);
    
    // Load image with Jimp
    const image = await Jimp.read(imageBuffer);
    
    // Scan each pixel and classify by color similarity
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1]; 
      const b = this.bitmap.data[idx + 2];
      
      // Find matching color in legend
      for (let index = 0; index < legend_ndwi.length; index++) {
        if (compareColors([r, g, b], legend_ndwi[index])) {
          zones[index]++;
          break;
        }
      }
    });
    
    // Calculate total pixels
    const totalPixels = zones.reduce((a, b) => a + b, 0);
    
    // Calculate percentages and areas for each zone
    const zoneAnalysis = zones.map((pixelCount, index) => {
      const percentage = totalPixels > 0 ? ((pixelCount / totalPixels) * 100) : 0;
      const areaHectares = (percentage * farmSize * 0.404686) / 100; // Convert acres to hectares
      
      return {
        zone_id: index + 1,
        status: getStressStatus(index),
        ndwi_range: getNDWIRange(index),
        area_percentage: parseFloat(percentage.toFixed(1)),
        area_hectares: parseFloat(areaHectares.toFixed(3)) // Show 3 decimal places for small areas
      };
    }).filter(zone => zone.area_percentage > 0); // Only include zones with actual coverage
    
    // Calculate average NDWI (estimated based on zone distribution)
    const averageNDWI = calculateAverageNDWI(zones, totalPixels);
    
    console.log(`NDWI image processing complete. Found ${zoneAnalysis.length} stress zones.`);
    
    return {
      average_ndwi: averageNDWI,
      zones: zoneAnalysis
    };
    
  } catch (error) {
    console.error("Error processing NDWI image:", error);
    throw error;
  }
};

/**
 * Compare two RGB color arrays for similarity (with tolerance)
 * @param {Array} color1 - [R, G, B] array
 * @param {Array} color2 - [R, G, B] array  
 * @returns {boolean} True if colors are similar
 */
const compareColors = (color1, color2, tolerance = 10) => {
  return Math.abs(color1[0] - color2[0]) <= tolerance &&
         Math.abs(color1[1] - color2[1]) <= tolerance &&
         Math.abs(color1[2] - color2[2]) <= tolerance;
};

/**
 * Get stress status based on zone index
 * @param {number} index - Zone index in legend array
 * @returns {string} Stress status
 */
const getStressStatus = (index) => {
  const statusMap = [
    "High Stress",      // Yellow - driest areas
    "Moderate Stress",  // Light green - moderate water availability
    "Low Stress",       // Blue - good water availability  
    "Very Low Stress"   // Purple - highest water availability
  ];
  return statusMap[index] || "Unknown";
};

/**
 * Get NDWI range based on zone index
 * @param {number} index - Zone index in legend array
 * @returns {string} NDWI range
 */
const getNDWIRange = (index) => {
  const rangeMap = [
    "-0.1-0.1",   // High stress
    "0.1-0.2",    // Moderate stress
    "0.2-0.3",    // Low stress
    "0.3+"        // Very low stress
  ];
  return rangeMap[index] || "Unknown";
};

/**
 * Calculate estimated average NDWI based on zone distribution
 * @param {Array} zones - Pixel counts per zone
 * @param {number} totalPixels - Total pixel count
 * @returns {number} Estimated average NDWI
 */
const calculateAverageNDWI = (zones, totalPixels) => {
  if (totalPixels === 0) return 0;
  
  // Estimate NDWI values for each zone (midpoint of ranges)
  const ndwiEstimates = [0.05, 0.15, 0.25, 0.4]; // Midpoints of ranges
  
  let weightedSum = 0;
  zones.forEach((pixelCount, index) => {
    const weight = pixelCount / totalPixels;
    weightedSum += weight * ndwiEstimates[index];
  });
  
  return parseFloat(weightedSum.toFixed(2));
};

/**
 * Get overall water stress level based on average NDWI
 * @param {number} averageNDWI - Average NDWI value
 * @returns {string} Overall stress level
 */
const getOverallStressLevel = (averageNDWI) => {
  if (averageNDWI < 0.1) return "High";
  if (averageNDWI < 0.2) return "Moderate"; 
  if (averageNDWI < 0.3) return "Low";
  return "Very Low";
};

/**
 * Generate mock NDWI analysis for fallback
 * @param {number} farmSize - Farm size in acres
 * @returns {Object} Mock NDWI analysis
 */
const getMockNDWIAnalysis = (farmSize) => {
  const farmSizeHectares = farmSize * 0.404686;
  
  return {
    average_ndwi: 0.18,
    zones: [
      {
        zone_id: 1,
        status: "Low Stress",
        ndwi_range: "0.2-0.3",
        area_percentage: 45.7,
        area_hectares: parseFloat((farmSizeHectares * 0.457).toFixed(2))
      },
      {
        zone_id: 2,
        status: "Moderate Stress", 
        ndwi_range: "0.1-0.2",
        area_percentage: 38.1,
        area_hectares: parseFloat((farmSizeHectares * 0.381).toFixed(2))
      },
      {
        zone_id: 3,
        status: "High Stress",
        ndwi_range: "-0.1-0.1", 
        area_percentage: 16.2,
        area_hectares: parseFloat((farmSizeHectares * 0.162).toFixed(2))
      }
    ]
  };
};

module.exports = {
  getNDWIAnalysis,
  getOverallStressLevel,
  getMockNDWIAnalysis
};