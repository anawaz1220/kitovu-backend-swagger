const express = require("express");
const { getCropHealth, getFertilizerRecommendation, getWaterStress } = require("../controllers/advisoryController");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * /api/advisory/crop_health/{farm_id}:
 *   get:
 *     summary: Get crop health analysis for a farm
 *     tags: [Advisory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: farm_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The farm ID
 *     responses:
 *       200:
 *         description: Crop health analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 farm_id:
 *                   type: string
 *                 analysis_date:
 *                   type: string
 *                   format: date-time
 *                 crop:
 *                   type: string
 *                 growth_stage:
 *                   type: string
 *                 overall_health_index:
 *                   type: number
 *                 status:
 *                   type: string
 *                 ndvi_analysis:
 *                   type: object
 *                 alerts:
 *                   type: array
 *                 recommendations:
 *                   type: array
 *       404:
 *         description: Farm not found
 *       500:
 *         description: Server error
 */
router.get("/advisory/crop_health/:farm_id", auth, getCropHealth);

/**
 * @swagger
 * /api/advisory/fertilizer/{farm_id}:
 *   get:
 *     summary: Get fertilizer recommendations for a farm
 *     tags: [Advisory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: farm_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The farm ID
 *     responses:
 *       200:
 *         description: Fertilizer recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 farm_id:
 *                   type: string
 *                   description: Unique identifier for the farm
 *                 crop:
 *                   type: string
 *                   description: Type of crop grown on the farm
 *                 farm_size_hectares:
 *                   type: number
 *                   format: double
 *                   description: Farm size in hectares
 *                 soil_analysis:
 *                   type: object
 *                   description: Soil nutrient analysis results
 *                   properties:
 *                     nitrogen_total:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [Very Low, Low, Medium, High]
 *                         value:
 *                           type: number
 *                         unit:
 *                           type: string
 *                         name:
 *                           type: string
 *                     phosphorous_extractable:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [Very Low, Low, Medium, High]
 *                         value:
 *                           type: number
 *                         unit:
 *                           type: string
 *                         name:
 *                           type: string
 *                     potassium_extractable:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [Very Low, Low, Medium, High]
 *                         value:
 *                           type: number
 *                         unit:
 *                           type: string
 *                         name:
 *                           type: string
 *                     magnesium_extractable:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [Very Low, Low, Medium, High]
 *                         value:
 *                           type: number
 *                         unit:
 *                           type: string
 *                         name:
 *                           type: string
 *                     calcium_extractable:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [Low, Medium, High]
 *                         value:
 *                           type: number
 *                         unit:
 *                           type: string
 *                         name:
 *                           type: string
 *                     sulphur_extractable:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [Low, Medium, High]
 *                         value:
 *                           type: number
 *                         unit:
 *                           type: string
 *                         name:
 *                           type: string
 *                     iron_extractable:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [Very Low, Low, Medium, High]
 *                         value:
 *                           type: number
 *                         unit:
 *                           type: string
 *                         name:
 *                           type: string
 *                 recommendations:
 *                   type: object
 *                   properties:
 *                     total_fertilizer_quantity:
 *                       type: number
 *                       format: double
 *                       description: Total fertilizer quantity needed
 *                     unit:
 *                       type: string
 *                       description: Unit of measurement
 *                     composition:
 *                       type: array
 *                       description: Breakdown of fertilizer composition
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             description: Nutrient type (e.g., Nitrogen, Phosphorus)
 *                           quantity:
 *                             type: number
 *                             format: double
 *                           unit:
 *                             type: string
 *                     application_schedule:
 *                       type: array
 *                       description: When and how much to apply
 *                       items:
 *                         type: object
 *                         properties:
 *                           stage:
 *                             type: string
 *                             description: Growth stage for application
 *                           percentage:
 *                             type: number
 *                             description: Percentage of total fertilizer
 *                           quantity:
 *                             type: number
 *                             format: double
 *                           unit:
 *                             type: string
 *                 commercial_products:
 *                   type: array
 *                   description: Recommended commercial fertilizer products
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: Product name
 *                       quantity:
 *                         type: number
 *                         format: double
 *                       unit:
 *                         type: string
 *                 commentary:
 *                   type: string
 *                   description: Additional recommendations and advice
 *                 data_source:
 *                   type: string
 *                   description: Source of data (real or mock)
 *                 error_message:
 *                   type: string
 *                   description: Error message if any issues occurred
 *               example:
 *                 farm_id: "farm_12345"
 *                 crop: "maize"
 *                 farm_size_hectares: 1.01
 *                 soil_analysis:
 *                   nitrogen_total:
 *                     status: "Low"
 *                     value: 18.4
 *                     unit: "mg/kg"
 *                     name: "nitrogen"
 *                   phosphorous_extractable:
 *                     status: "Medium"
 *                     value: 35.6
 *                     unit: "mg/kg"
 *                     name: "phosphorous"
 *                   potassium_extractable:
 *                     status: "High"
 *                     value: 156.2
 *                     unit: "mg/kg"
 *                     name: "potassium"
 *                   magnesium_extractable:
 *                     status: "Medium"
 *                     value: 42.1
 *                     unit: "mg/kg"
 *                     name: "magnesium"
 *                   calcium_extractable:
 *                     status: "Medium"
 *                     value: 112.8
 *                     unit: "mg/kg"
 *                     name: "calcium"
 *                   sulphur_extractable:
 *                     status: "Low"
 *                     value: 4.6
 *                     unit: "mg/kg"
 *                     name: "sulphur"
 *                   iron_extractable:
 *                     status: "Medium"
 *                     value: 85.3
 *                     unit: "mg/kg"
 *                     name: "iron"
 *                 recommendations:
 *                   total_fertilizer_quantity: 135.2
 *                   unit: "kg"
 *                   composition:
 *                     - type: "Nitrogen"
 *                       quantity: 80.5
 *                       unit: "kg"
 *                     - type: "Phosphorus"
 *                       quantity: 30.2
 *                       unit: "kg"
 *                     - type: "Potassium"
 *                       quantity: 24.5
 *                       unit: "kg"
 *                   application_schedule:
 *                     - stage: "Planting"
 *                       percentage: 40
 *                       quantity: 54.1
 *                       unit: "kg"
 *                     - stage: "Vegetative"
 *                       percentage: 60
 *                       quantity: 81.1
 *                       unit: "kg"
 *                 commercial_products:
 *                   - name: "NPK 15-15-15"
 *                     quantity: 90.1
 *                     unit: "kg"
 *                   - name: "Urea"
 *                     quantity: 45.1
 *                     unit: "kg"
 *                 commentary: "Slow growth and uniform yellowing of older leaves are usually the first symptoms of nitrogen (N) deficiency."
 *       404:
 *         description: Farm not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Farm not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
router.get("/advisory/fertilizer/:farm_id", auth, getFertilizerRecommendation);

/**
 * @swagger
 * /api/water_stress/{farm_id}:
 *   get:
 *     summary: Get water stress analysis and irrigation recommendations for a farm
 *     tags: [Advisory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: farm_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The farm ID
 *     responses:
 *       200:
 *         description: Water stress analysis and irrigation recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 farm_id:
 *                   type: string
 *                   description: Unique identifier for the farm
 *                 analysis_date:
 *                   type: string
 *                   format: date-time
 *                   description: Date and time of analysis
 *                 crop:
 *                   type: string
 *                   description: Type of crop grown on the farm
 *                 overall_stress_level:
 *                   type: string
 *                   enum: [Very Low, Low, Moderate, High]
 *                   description: Overall water stress level of the farm
 *                 ndwi_analysis:
 *                   type: object
 *                   description: NDWI (Normalized Difference Water Index) analysis
 *                   properties:
 *                     average_ndwi:
 *                       type: number
 *                       format: double
 *                       description: Average NDWI value across the farm
 *                     zones:
 *                       type: array
 *                       description: Water stress zones within the farm
 *                       items:
 *                         type: object
 *                         properties:
 *                           zone_id:
 *                             type: integer
 *                             description: Unique identifier for the zone
 *                           status:
 *                             type: string
 *                             enum: [Very Low Stress, Low Stress, Moderate Stress, High Stress]
 *                             description: Water stress level in this zone
 *                           ndwi_range:
 *                             type: string
 *                             description: NDWI value range for this zone
 *                           area_percentage:
 *                             type: number
 *                             format: double
 *                             description: Percentage of total farm area
 *                           area_hectares:
 *                             type: number
 *                             format: double
 *                             description: Area in hectares
 *                 weather_data:
 *                   type: object
 *                   description: Recent weather data and rainfall information
 *                   properties:
 *                     recent_rainfall:
 *                       type: object
 *                       properties:
 *                         last_7_days:
 *                           type: number
 *                           format: double
 *                           description: Rainfall in the last 7 days
 *                         unit:
 *                           type: string
 *                           description: Unit of measurement (mm)
 *                     rainfall_anomaly:
 *                       type: number
 *                       format: double
 *                       description: Difference from expected rainfall (negative means below average)
 *                     unit:
 *                       type: string
 *                       description: Unit of measurement for anomaly (mm)
 *                 recommendations:
 *                   type: array
 *                   description: Irrigation and water management recommendations
 *                   items:
 *                     type: object
 *                     properties:
 *                       action:
 *                         type: string
 *                         description: Recommended action (e.g., Irrigation, Mulching)
 *                       urgency:
 *                         type: string
 *                         enum: [Low, Medium, High]
 *                         description: Priority level of the recommendation
 *                       target_zones:
 *                         type: array
 *                         items:
 *                           type: integer
 *                         description: Zone IDs where action should be applied
 *                       water_quantity:
 *                         type: number
 *                         format: double
 *                         description: Amount of water to apply (if applicable)
 *                       unit:
 *                         type: string
 *                         description: Unit of water measurement (mm)
 *                       description:
 *                         type: string
 *                         description: Detailed description of the recommendation
 *                 data_source:
 *                   type: string
 *                   enum: [real, mock]
 *                   description: Source of the data (real from APIs or mock for fallback)
 *                 error_message:
 *                   type: string
 *                   description: Error message if any issues occurred during analysis
 *                 setup_instructions:
 *                   type: string
 *                   description: Instructions for setting up missing API keys
 *               example:
 *                 farm_id: "farm_12345"
 *                 analysis_date: "2025-04-15T10:30:00Z"
 *                 crop: "maize"
 *                 overall_stress_level: "Moderate"
 *                 ndwi_analysis:
 *                   average_ndwi: 0.18
 *                   zones:
 *                     - zone_id: 1
 *                       status: "Low Stress"
 *                       ndwi_range: "0.2-0.3"
 *                       area_percentage: 45.7
 *                       area_hectares: 1.14
 *                     - zone_id: 2
 *                       status: "Moderate Stress"
 *                       ndwi_range: "0.1-0.2"
 *                       area_percentage: 38.1
 *                       area_hectares: 0.95
 *                     - zone_id: 3
 *                       status: "High Stress"
 *                       ndwi_range: "-0.1-0.1"
 *                       area_percentage: 16.2
 *                       area_hectares: 0.41
 *                 weather_data:
 *                   recent_rainfall:
 *                     last_7_days: 12.4
 *                     unit: "mm"
 *                   rainfall_anomaly: -8.6
 *                   unit: "mm"
 *                 recommendations:
 *                   - action: "Irrigation"
 *                     urgency: "Medium"
 *                     target_zones: [2, 3]
 *                     water_quantity: 12.5
 *                     unit: "mm"
 *                     description: "Apply 12.5mm of water to moderate and high stress areas"
 *                   - action: "Mulching"
 *                     urgency: "Low"
 *                     target_zones: [3]
 *                     description: "Apply mulch to reduce water loss in high stress areas"
 *       404:
 *         description: Farm not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Farm not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
router.get("/water_stress/:farm_id", auth, getWaterStress);

module.exports = router;