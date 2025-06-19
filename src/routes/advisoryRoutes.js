// Updated advisoryRoutes.js with complete enhanced herbicide/pesticide endpoint

const express = require("express");
const { getCropHealth, getFertilizerRecommendation, getWaterStress, getHerbicidePesticide } = require("../controllers/advisoryController");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * /api/advisory/herbicide_pesticide/{farm_id}:
 *   get:
 *     summary: Get herbicide and pesticide recommendations for a farm
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
 *       - in: query
 *         name: planting_date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Date when crop was planted (YYYY-MM-DD format)
 *         example: "2025-01-15"
 *       - in: query
 *         name: growth_stage
 *         required: false
 *         schema:
 *           type: string
 *           enum: [pre-planting, germination, vegetative, reproductive, maturity]
 *         description: Current growth stage of the crop (alternative to planting_date)
 *         example: "vegetative"
 *       - in: query
 *         name: timing_preference
 *         required: false
 *         schema:
 *           type: string
 *           enum: [pre-planting, pre-emergence, post-emergence, pre-harvest]
 *         description: Preferred application timing
 *         example: "pre-emergence"
 *       - in: query
 *         name: weed_pressure
 *         required: false
 *         schema:
 *           type: string
 *           enum: [high, medium, low]
 *         description: Expected weed pressure level
 *         example: "medium"
 *       - in: query
 *         name: target_weeds
 *         required: false
 *         schema:
 *           type: string
 *         description: Comma-separated list of specific weeds to target
 *         example: "broadleaf,grasses"
 *     responses:
 *       200:
 *         description: Herbicide and pesticide recommendations
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
 *                 growth_stage:
 *                   type: string
 *                   enum: [pre-planting, germination, vegetative, reproductive, maturity]
 *                   description: Current growth stage of the crop
 *                 farm_size_hectares:
 *                   type: number
 *                   format: double
 *                   description: Farm size in hectares
 *                 weed_pressure:
 *                   type: string
 *                   enum: [high, medium, low]
 *                   description: Assessed weed pressure level
 *                 recommendations:
 *                   type: object
 *                   properties:
 *                     herbicides:
 *                       type: array
 *                       description: Recommended herbicide treatments
 *                       items:
 *                         type: object
 *                         properties:
 *                           herbicide_type:
 *                             type: string
 *                             description: Type of herbicide (e.g., glyphosate, atrazine)
 *                           active_ingredient:
 *                             type: string
 *                             description: Active ingredient name
 *                           application_timing:
 *                             type: string
 *                             enum: [pre-planting, pre-emergence, post-emergence, pre-harvest]
 *                             description: When to apply the herbicide
 *                           recommended_brand:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                                 description: Brand name
 *                               concentration:
 *                                 type: string
 *                                 description: Active ingredient concentration
 *                               manufacturer:
 *                                 type: string
 *                                 description: Manufacturer name
 *                           application_details:
 *                             type: object
 *                             properties:
 *                               rate_per_hectare:
 *                                 type: string
 *                                 description: Application rate per hectare
 *                               total_quantity:
 *                                 type: number
 *                                 format: double
 *                                 description: Total quantity needed for the farm
 *                               unit:
 *                                 type: string
 *                                 description: Unit of measurement (L or kg)
 *                               dilution_water:
 *                                 type: number
 *                                 format: double
 *                                 description: Water needed for dilution
 *                               dilution_unit:
 *                                 type: string
 *                                 description: Unit for dilution water (L)
 *                               total_spray_volume:
 *                                 type: number
 *                                 format: double
 *                                 description: Total spray volume needed
 *                           timing_instructions:
 *                             type: object
 *                             properties:
 *                               growth_stage:
 *                                 type: string
 *                                 description: Optimal crop growth stage for application
 *                               safety_period_before_harvest:
 *                                 type: string
 *                                 description: Minimum days between application and harvest
 *                               optimal_conditions:
 *                                 type: array
 *                                 items:
 *                                   type: string
 *                                 description: Optimal weather and field conditions
 *                           target_weeds:
 *                             type: string
 *                             description: Types of weeds this herbicide targets
 *                           mode_of_action:
 *                             type: string
 *                             description: How the herbicide works
 *                           spectrum:
 *                             type: string
 *                             description: Selectivity spectrum (selective vs non-selective)
 *                           application_method:
 *                             type: string
 *                             description: Method of application (foliar spray, soil application)
 *                           contraindications:
 *                             type: string
 *                             description: When not to use this herbicide
 *                           safety_notes:
 *                             type: array
 *                             items:
 *                               type: string
 *                             description: Safety precautions and guidelines
 *                           special_notes:
 *                             type: string
 *                             description: Any special instructions for this herbicide
 *                     alternatives:
 *                       type: array
 *                       description: Alternative brand options
 *                       items:
 *                         type: object
 *                         properties:
 *                           herbicide_type:
 *                             type: string
 *                             description: Type of herbicide
 *                           alternative_brand:
 *                             type: string
 *                             description: Alternative brand name
 *                           concentration:
 *                             type: string
 *                             description: Concentration of alternative brand
 *                           manufacturer:
 *                             type: string
 *                             description: Manufacturer of alternative brand
 *                           reason:
 *                             type: string
 *                             description: Why this is offered as an alternative
 *                     application_guidelines:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: General application guidelines for the crop
 *                     safety_guidelines:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: General safety guidelines for herbicide application
 *                 pesticides:
 *                   type: array
 *                   description: Pesticide recommendations (placeholder for future implementation)
 *                   items:
 *                     type: object
 *                     properties:
 *                       target_pest:
 *                         type: string
 *                         description: Target pest name
 *                       product_name:
 *                         type: string
 *                         description: Recommended pesticide product
 *                       application_rate:
 *                         type: number
 *                         format: double
 *                         description: Application rate
 *                       unit:
 *                         type: string
 *                         description: Unit of measurement
 *                       total_quantity:
 *                         type: number
 *                         format: double
 *                         description: Total quantity needed
 *                       timing:
 *                         type: string
 *                         description: When to apply the pesticide
 *                 data_source:
 *                   type: string
 *                   description: Source of the recommendation data
 *                   enum: [agricultural_extension_database, fallback]
 *                 error_message:
 *                   type: string
 *                   description: Error message if any issues occurred
 *                 generated_at:
 *                   type: string
 *                   format: date-time
 *                   description: When the recommendations were generated
 *               example:
 *                 farm_id: "farm_12345"
 *                 crop: "maize"
 *                 growth_stage: "vegetative"
 *                 farm_size_hectares: 1.01
 *                 weed_pressure: "medium"
 *                 recommendations:
 *                   herbicides:
 *                     - herbicide_type: "atrazine"
 *                       active_ingredient: "Atrazine"
 *                       application_timing: "pre-emergence"
 *                       recommended_brand:
 *                         name: "Sun-Atrazine"
 *                         concentration: "80% WP"
 *                         manufacturer: "Zhejiang Wynca Chemical Group Co., Ltd."
 *                       application_details:
 *                         rate_per_hectare: "1.5-2.0 kg/ha"
 *                         total_quantity: 1.75
 *                         unit: "kg"
 *                         dilution_water: 250.0
 *                         dilution_unit: "L"
 *                         total_spray_volume: 251.75
 *                       timing_instructions:
 *                         growth_stage: "Soil treatment before crop emergence or within 2-3 weeks after crop emergence"
 *                         safety_period_before_harvest: "60 days"
 *                         optimal_conditions:
 *                           - "Apply during calm weather conditions (wind speed < 5 mph)"
 *                           - "Avoid application when rain is expected within 4-6 hours"
 *                           - "Best applied during early morning or late evening"
 *                           - "Ensure soil moisture is adequate for activation"
 *                       target_weeds: "Annual broadleaf weeds and some grassy weeds"
 *                       mode_of_action: "Selective systemic"
 *                       spectrum: "Selective control of broadleaf weeds and some grasses"
 *                       application_method: "Apply as a uniform spray to the soil surface or foliage (for early post-emergence)"
 *                       contraindications: "Do not apply on crops other than labeled ones; avoid application on waterlogged soils; avoid mixing with incompatible chemicals"
 *                       safety_notes:
 *                         - "Use appropriate personal protective equipment (PPE)"
 *                         - "Keep away from children and livestock"
 *                         - "Do not contaminate water sources"
 *                         - "Store in original container in a cool, dry place"
 *                     - herbicide_type: "glyphosate"
 *                       active_ingredient: "Glyphosate"
 *                       application_timing: "pre-planting"
 *                       recommended_brand:
 *                         name: "Sunphosate"
 *                         concentration: "360 g/L"
 *                         manufacturer: "Zhejiang Wynca Chemical Group Co., Ltd."
 *                       application_details:
 *                         rate_per_hectare: "2-4L/ha"
 *                         total_quantity: 3.03
 *                         unit: "L"
 *                         dilution_water: 303.0
 *                         dilution_unit: "L"
 *                         total_spray_volume: 306.03
 *                       timing_instructions:
 *                         growth_stage: "Land preparation stage"
 *                         safety_period_before_harvest: "14 days"
 *                         optimal_conditions:
 *                           - "Apply during calm weather conditions (wind speed < 5 mph)"
 *                           - "Avoid application when rain is expected within 4-6 hours"
 *                           - "Best applied during early morning or late evening"
 *                           - "Ensure soil moisture is adequate for activation"
 *                       target_weeds: "Annual/perennial broadleaf, grasses, shrubs"
 *                       mode_of_action: "Non-selective systemic"
 *                       spectrum: "Non-selective; broad-spectrum"
 *                       application_method: "Foliar spray"
 *                       contraindications: "Avoid application if rain is expected within 4–6 hours; do not apply on desirable vegetation and 12 to 24 hours entry level after application."
 *                       safety_notes:
 *                         - "Use appropriate personal protective equipment (PPE)"
 *                         - "Keep away from children and livestock"
 *                         - "Do not contaminate water sources"
 *                         - "Store in original container in a cool, dry place"
 *                   alternatives:
 *                     - herbicide_type: "atrazine"
 *                       alternative_brand: "AtraForce"
 *                       concentration: "80% WP"
 *                       manufacturer: "Jubaili Agrotech"
 *                       reason: "Alternative brand for same active ingredient"
 *                     - herbicide_type: "glyphosate"
 *                       alternative_brand: "Force Up"
 *                       concentration: "480 g/L"
 *                       manufacturer: "Jubaili Agrotech"
 *                       reason: "Alternative brand for same active ingredient"
 *                   application_guidelines:
 *                     - "Calibrate spraying equipment before application"
 *                     - "Ensure uniform coverage for best results"
 *                     - "Monitor weather conditions closely"
 *                     - "Consider tank mixing only with compatible products"
 *                     - "Follow crop rotation guidelines to prevent resistance"
 *                   safety_guidelines:
 *                     - "Apply herbicides when soil is moist but not waterlogged"
 *                     - "Apply pesticides in the early morning or late evening to minimize bee exposure"
 *                     - "Ensure proper calibration of spraying equipment"
 *                     - "Follow all safety guidelines and use appropriate PPE"
 *                     - "Keep records of all applications for future reference"
 *                     - "Do not apply near water sources or during windy conditions"
 *                 pesticides: []
 *                 data_source: "agricultural_extension_database"
 *                 generated_at: "2025-06-10T14:30:00Z"
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
 *                   example: "Error in herbicide/pesticide recommendation"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.get("/advisory/herbicide_pesticide/:farm_id", auth, getHerbicidePesticide);

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
 *                     application_schedule:
 *                       type: array
 *                       description: When and how much to apply
 *                 commercial_products:
 *                   type: array
 *                   description: Recommended commercial fertilizer products
 *                 commentary:
 *                   type: string
 *                   description: Additional recommendations and advice
 *       404:
 *         description: Farm not found
 *       500:
 *         description: Server error
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
 *                 weather_data:
 *                   type: object
 *                   description: Recent weather data and rainfall information
 *                 recommendations:
 *                   type: array
 *                   description: Irrigation and water management recommendations
 *       404:
 *         description: Farm not found
 *       500:
 *         description: Server error
 */
router.get("/water_stress/:farm_id", auth, getWaterStress);

module.exports = router;