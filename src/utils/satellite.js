const axios = require("axios");

/**
 * Get authentication token for Sentinel Hub API
 * @param {Function} callback - Callback function to receive the token
 */
const getSentinelToken = (callback) => {
    const instance = axios.create({
        baseURL: "https://services.sentinel-hub.com",
    });

    const config = {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        },
    };

    // Use environment variables for client credentials in production
    const body = "client_id=12f984c1-62f0-4a54-a5a6-d17365b4ab95&client_secret=d41nxNHD<PabP#o)0YrrH5|74_.Jk2-R:J7XY5!!&grant_type=client_credentials";

    instance.post("/oauth/token", body, config)
        .then((resp) => {
            callback(resp.data.access_token);
        })
        .catch((error) => {
            console.error("Error getting Sentinel Hub token:", error);
            callback(null);
        });
};

/**
 * Convert array buffer to Base64 string
 * @param {Uint8Array} u8Arr - Uint8Array to convert
 * @returns {string} - Base64 string
 */
const uint8ToBase64 = (u8Arr) => {
    const CHUNK_SIZE = 0x8000;
    let index = 0;
    const length = u8Arr.length;
    let result = "";
    let slice;
    
    while (index < length) {
        slice = u8Arr.subarray(index, Math.min(index + CHUNK_SIZE, length));
        result += String.fromCharCode.apply(null, slice);
        index += CHUNK_SIZE;
    }
    
    return Buffer.from(result).toString('base64');
};

/**
 * Process satellite image to calculate NDVI zones
 * @param {Uint8Array} imageData - Image data from Sentinel Hub
 * @param {Array} legend - Color legend for NDVI zones
 * @param {number} farmSize - Farm size in acres
 * @returns {Object} - NDVI zones analysis
 */
const calculateNDVIZones = async (imageData, legend, farmSize) => {
    // This is a placeholder for the Jimp processing that occurs in agent.js
    // In a production environment, you would use a Node.js image processing 
    // library like Jimp or Sharp to analyze the pixel data
    
    // For now, return mock data
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

module.exports = {
    getSentinelToken,
    uint8ToBase64,
    calculateNDVIZones
};