const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { farmFilter, debugData } = require("../controllers/analyticsController");

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Comprehensive farming analytics with cascading filters
 */

/**
 * @swagger
 * /api/analytics/farm-filter:
 *   post:
 *     summary: Get comprehensive farming analytics with cascading filters
 *     description: Returns filtered analytics data including summary stats, map coordinates, breakdowns, and unique crops
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               state:
 *                 type: string
 *                 description: Filter by state (optional)
 *                 example: "abia"
 *               lga:
 *                 type: string
 *                 description: Filter by Local Government Area (optional)
 *                 example: "aba_north"
 *               city:
 *                 type: string
 *                 description: Filter by city/ward (optional)
 *                 example: "ward_1"
 *               farm_type:
 *                 type: string
 *                 enum: ["livestock_farming", "crop_farming", "both"]
 *                 description: Filter by farm type (optional)
 *                 example: "crop_farming"
 *               crop_type:
 *                 type: string
 *                 description: Filter by specific crop type (optional)
 *                 example: "maize"
 *     responses:
 *       200:
 *         description: Comprehensive analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 filters_applied:
 *                   type: object
 *                   properties:
 *                     state:
 *                       type: string
 *                       nullable: true
 *                     lga:
 *                       type: string
 *                       nullable: true
 *                     city:
 *                       type: string
 *                       nullable: true
 *                     farm_type:
 *                       type: string
 *                       nullable: true
 *                     crop_type:
 *                       type: string
 *                       nullable: true
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total_farmers:
 *                       type: integer
 *                       example: 1250
 *                     total_farms:
 *                       type: integer
 *                       example: 890
 *                     total_area_acres:
 *                       type: number
 *                       format: float
 *                       example: 5420.50
 *                 map_data:
 *                   type: object
 *                   properties:
 *                     farmers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           farmer_id:
 *                             type: string
 *                             format: uuid
 *                           latitude:
 *                             type: number
 *                             format: double
 *                           longitude:
 *                             type: number
 *                             format: double
 *                     farms:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           farm_id:
 *                             type: string
 *                             format: uuid
 *                           centroid_latitude:
 *                             type: number
 *                             format: double
 *                           centroid_longitude:
 *                             type: number
 *                             format: double
 *                 breakdowns:
 *                   type: object
 *                   properties:
 *                     by_state:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           farmers_count:
 *                             type: integer
 *                           farms_count:
 *                             type: integer
 *                           total_area_acres:
 *                             type: number
 *                             format: float
 *                           crops:
 *                             type: object
 *                             additionalProperties:
 *                               type: integer
 *                     by_lga:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           farmers_count:
 *                             type: integer
 *                           farms_count:
 *                             type: integer
 *                           total_area_acres:
 *                             type: number
 *                             format: float
 *                           crops:
 *                             type: object
 *                             additionalProperties:
 *                               type: integer
 *                     by_community:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           farmers_count:
 *                             type: integer
 *                           farms_count:
 *                             type: integer
 *                           total_area_acres:
 *                             type: number
 *                             format: float
 *                           crops:
 *                             type: object
 *                             additionalProperties:
 *                               type: integer
 *                 unique_crops:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["maize", "cassava", "rice", "yam"]
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
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
router.post("/analytics/farm-filter", auth, farmFilter);

/**
 * @swagger
 * /api/analytics/debug:
 *   get:
 *     summary: Debug endpoint to check database data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Debug information about database data
 */
router.get("/analytics/debug", auth, debugData);

module.exports = router;