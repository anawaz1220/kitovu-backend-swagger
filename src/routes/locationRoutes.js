const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { 
  getFarmersCountByLocation, 
  getCropsByLocation,
  getAbiaStateSummary,
  getAbiaLGAsSummary,
  getAbiaStateBoundary,
  getAbiaLGAsBoundaries
} = require("../controllers/locationController");

/**
 * @swagger
 * tags:
 *   name: Location
 *   description: APIs for managing locations and related data
 */

/**
 * @swagger
 * /api/locations/farmers-count:
 *   get:
 *     summary: Get the count of farmers inside each location
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         required: true
 *         description: The type of location (e.g., LGA, Community)
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         required: false
 *         description: The name of the location (optional)
 *     responses:
 *       200:
 *         description: A list of locations with farmer counts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: The name of the location or community
 *                     example: Location A
 *                   farmer_count:
 *                     type: integer
 *                     description: The number of farmers inside the location or community
 *                     example: 10
 *                   geom:
 *                     type: object
 *                     description: The geometry of the location (null for community)
 *                     nullable: true
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       500:
 *         description: Internal server error
 */
router.get("/locations/farmers-count", auth, getFarmersCountByLocation);

/**
 * @swagger
 * /api/locations/crops:
 *   get:
 *     summary: Get crop data by location
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         required: true
 *         description: The type of location (e.g., LGA, Community)
 *       - in: query
 *         name: crop
 *         schema:
 *           type: string
 *         required: false
 *         description: The type of crop (optional)
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         required: false
 *         description: The name of the location (optional)
 *     responses:
 *       200:
 *         description: A list of locations with crop data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: The name of the location or community
 *                     example: Location A
 *                   farms_count:
 *                     type: integer
 *                     description: The number of farms in the location or community
 *                     example: 5
 *                   crop_area:
 *                     type: number
 *                     format: double
 *                     description: The total area of the crop in the location or community (in acres)
 *                     example: 100.5
 *                   geom:
 *                     type: object
 *                     description: The geometry of the location (null for community)
 *                     nullable: true
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       500:
 *         description: Internal server error
 */
router.get("/locations/crops", auth, getCropsByLocation);

/**
 * @swagger
 * /api/locations/abia-state/summary:
 *   get:
 *     summary: Get Abia state summary with farmers, farms, crops, and total area
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Abia state summary data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state_name:
 *                   type: string
 *                   example: Abia
 *                 farmers_count:
 *                   type: integer
 *                   description: Total number of farmers in Abia state
 *                   example: 1250
 *                 farms_count:
 *                   type: integer
 *                   description: Total number of farms in Abia state
 *                   example: 890
 *                 crops_by_count:
 *                   type: array
 *                   description: List of crops with their counts and areas
 *                   items:
 *                     type: object
 *                     properties:
 *                       crop_type:
 *                         type: string
 *                         example: maize
 *                       count:
 *                         type: integer
 *                         example: 45
 *                       area:
 *                         type: number
 *                         format: double
 *                         example: 125.75
 *                 total_area_acres:
 *                   type: number
 *                   format: double
 *                   description: Total area of all farms in acres
 *                   example: 5420.50
 *                 geom:
 *                   type: object
 *                   description: GeoJSON geometry of Abia state
 *       404:
 *         description: Abia state not found
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       500:
 *         description: Internal server error
 */
router.get("/locations/abia-state/summary", auth, getAbiaStateSummary);

/**
 * @swagger
 * /api/locations/abia-state/lgas/summary:
 *   get:
 *     summary: Get summary of all LGAs in Abia state
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Summary data for all Abia state LGAs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state_name:
 *                   type: string
 *                   example: Abia
 *                 lgas_summary:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       lga_name:
 *                         type: string
 *                         example: Aba North
 *                       farmers_count:
 *                         type: integer
 *                         example: 125
 *                       farms_count:
 *                         type: integer
 *                         example: 98
 *                       crops_by_count:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             crop_type:
 *                               type: string
 *                               example: cassava
 *                             count:
 *                               type: integer
 *                               example: 15
 *                       total_area_acres:
 *                         type: number
 *                         format: double
 *                         example: 450.25
 *                       geom:
 *                         type: object
 *                         description: GeoJSON geometry of the LGA
 *       404:
 *         description: No LGAs found for Abia state
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       500:
 *         description: Internal server error
 */
router.get("/locations/abia-state/lgas/summary", auth, getAbiaLGAsSummary);


/**
 * @swagger
 * /api/locations/abia-state/boundary:
 *   get:
 *     summary: Get Abia state administrative boundary
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Abia state boundary data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: Abia
 *                 type:
 *                   type: string
 *                   example: State
 *                 geom:
 *                   type: object
 *                   description: GeoJSON geometry of Abia state boundary
 *       404:
 *         description: Abia state boundary not found
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       500:
 *         description: Internal server error
 */
router.get("/locations/abia-state/boundary", auth, getAbiaStateBoundary);

/**
 * @swagger
 * /api/locations/abia-state/lgas/boundaries:
 *   get:
 *     summary: Get all Abia LGAs administrative boundaries
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Abia LGAs boundary data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state_name:
 *                   type: string
 *                   example: Abia
 *                 total_lgas:
 *                   type: integer
 *                   description: Total number of LGAs returned
 *                   example: 17
 *                 lgas:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: Aba North
 *                       type:
 *                         type: string
 *                         example: LGA
 *                       geom:
 *                         type: object
 *                         description: GeoJSON geometry of the LGA boundary
 *       404:
 *         description: No Abia LGA boundaries found
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       500:
 *         description: Internal server error
 */
router.get("/locations/abia-state/lgas/boundaries", auth, getAbiaLGAsBoundaries);

module.exports = router;