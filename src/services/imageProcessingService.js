/**
 * Process NDVI image from Sentinel Hub response
 * @param {Buffer} imageData - Image data buffer from Sentinel Hub
 * @param {number} farmSize - Size of the farm in acres
 * @returns {Object} NDVI analysis
 */
const processNDVIImage = async (imageData, farmSize) => {
  try {
    console.log("Loading image data for processing...");
    
    const Jimp = require('jimp');
    console.log("Loaded Jimp via CommonJS require");
    
    const fs = require('fs');
    const debug_path = 'debug_satellite_image.png';
    fs.writeFileSync(debug_path, imageData);
    console.log(`Saved debug image to ${debug_path}`);
    
    console.log("Reading image with Jimp from file...");
    const image = await Jimp.read(debug_path);
    console.log(`Image loaded: ${image.getWidth()}x${image.getHeight()} pixels`);
    
    const zones = new Array(10).fill(0);
    
    let totalNdvi = 0;
    let minNdvi = 1.0;
    let maxNdvi = -1.0;
    let pixelCount = 0;
    
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
    
    const colorSimilarity = (rgb1, rgb2, tolerance = 25) => {
      return Math.abs(rgb1[0] - rgb2[0]) <= tolerance && 
             Math.abs(rgb1[1] - rgb2[1]) <= tolerance && 
             Math.abs(rgb1[2] - rgb2[2]) <= tolerance;
    };
    
    console.log("Analyzing image pixels for NDVI data...");
    
    image.scan(0, 0, image.getWidth(), image.getHeight(), function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      const a = this.bitmap.data[idx + 3];
      
      if (a < 128) return;
      
      for (let i = 0; i < ndviColors.length; i++) {
        if (colorSimilarity([r, g, b], ndviColors[i].rgb)) {
          zones[i]++;
          
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
    
    const avgNdvi = pixelCount > 0 ? totalNdvi / pixelCount : 0;
    const totalPixels = zones.reduce((sum, count) => sum + count, 0);
    
    const zonesAnalysis = [];
    let zoneId = 1;
    
    const groupedZones = {};
    
    for (let i = 0; i < zones.length; i++) {
      if (zones[i] === 0) continue;
      
      const percentage = (zones[i] / totalPixels) * 100;
      const areaHectares = (percentage / 100) * farmSize * 0.404686;
      
      const status = ndviColors[i].status;
      
      if (!groupedZones[status]) {
        groupedZones[status] = {
          percentage: percentage,
          areaHectares: areaHectares,
          range: ndviColors[i].range
        };
      } else {
        groupedZones[status].percentage += percentage;
        groupedZones[status].areaHectares += areaHectares;
        if (percentage > groupedZones[status].percentage) {
          groupedZones[status].range = ndviColors[i].range;
        }
      }
    }
    
    for (const status in groupedZones) {
      zonesAnalysis.push({
        zone_id: zoneId++,
        status: status,
        ndvi_range: groupedZones[status].range,
        area_percentage: parseFloat(groupedZones[status].percentage.toFixed(1)),
        area_hectares: parseFloat(groupedZones[status].areaHectares.toFixed(4))
      });
    }
    
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

module.exports = {
  processNDVIImage
};