const axios = require("axios");
const turf = require("@turf/turf");

/**
 * Get Sentinel Hub token
 * @returns {Promise<string>} - Sentinel Hub token
 */
const getSentinelToken = async () => {
  try {
    console.log("Requesting Sentinel Hub token...");
    
    const clientId = process.env.SENTINEL_HUB_CLIENT_ID;
    const clientSecret = process.env.SENTINEL_HUB_CLIENT_SECRET;
    
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
      
      let geomData = farm.geom;
      if (typeof geomData === 'string') {
        try {
          geomData = JSON.parse(geomData);
          console.log("Successfully parsed geom from string to object");
        } catch (e) {
          console.log(`Could not parse geom as JSON: ${e.message}`);
        }
      }
      
      if (geomData && 
          geomData.type === 'MultiPolygon' && 
          Array.isArray(geomData.coordinates) && 
          geomData.coordinates.length > 0 && 
          Array.isArray(geomData.coordinates[0]) && 
          geomData.coordinates[0].length > 0 &&
          Array.isArray(geomData.coordinates[0][0])) {
        
        const coords = geomData.coordinates[0][0];
        
        if (coords && coords.length > 2) {
          console.log(`Successfully extracted ${coords.length} points from geom field`);
          
          const firstCoord = coords[0];
          if (Math.abs(firstCoord[0]) > 90) {
            console.log("Coordinates already in [lng, lat] format");
            return coords;
          } else {
            console.log("Converting coordinates from [lat, lng] to [lng, lat]");
            return coords.map(coord => [coord[1], coord[0]]);
          }
        }
      }
    }
    
    console.log("Could not extract coordinates from geom, trying Draw_Farm field");
    
    if (farm && farm.Draw_Farm && typeof farm.Draw_Farm === 'string') {
      console.log(`Parsing Draw_Farm field: ${farm.Draw_Farm}`);
      
      try {
        const points = farm.Draw_Farm.split(';').map(point => {
          const parts = point.trim().split(' ');
          if (parts.length >= 2) {
            const lat = parseFloat(parts[0]);
            const lng = parseFloat(parts[1]);
            return [lng, lat];
          }
          return null;
        }).filter(p => p !== null);
        
        if (points.length > 0) {
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
    
    if (farm && farm.farm_latitude && farm.farm_longitude) {
      console.log(`Using farm_latitude=${farm.farm_latitude} and farm_longitude=${farm.farm_longitude}`);
      const lat = parseFloat(farm.farm_latitude);
      const lng = parseFloat(farm.farm_longitude);
      
      const offset = 0.001;
      const points = [
        [lng - offset, lat - offset],
        [lng + offset, lat - offset],
        [lng + offset, lat + offset],
        [lng - offset, lat + offset],
        [lng - offset, lat - offset]
      ];
      
      console.log(`Created bounding box with ${points.length} points from center coordinates`);
      return points;
    }
    
    console.warn("Could not extract valid coordinates from farm data, using default Nigeria coordinates");
    
    return [
      [8.6753, 9.0820],
      [8.6853, 9.0820],
      [8.6853, 9.0920],
      [8.6753, 9.0920],
      [8.6753, 9.0820]
    ];
  } catch (error) {
    console.error(`Error extracting coordinates: ${error.message}`);
    
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
  // Add other eval scripts as needed
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

module.exports = {
  getSentinelToken,
  extractCoordinates,
  getEvalScript,
  verifyEnvironmentVariables
};