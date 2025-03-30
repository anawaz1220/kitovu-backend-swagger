const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getFarmersCountByLocation, getCropsByLocation } = require("../controllers/locationController");

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

module.exports = router;