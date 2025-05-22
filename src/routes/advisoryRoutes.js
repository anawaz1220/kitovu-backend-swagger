const express = require("express");
const { getCropHealth, getFertilizerRecommendation } = require("../controllers/advisoryController");
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

module.exports = router;