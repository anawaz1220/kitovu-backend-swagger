const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth"); // Import the auth middleware


const { createFarm, getFarms } = require("../controllers/farmController");
router.use(auth);


/**
 * @swagger
 * /api/farms:
 *   post:
 *     summary: Create a new farm
 *     tags: [Farms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               farmer_id:
 *                 type: string
 *                 description: ID of the farmer
 *               draw_farm:
 *                 type: object
 *                 description: GeoJSON representation of the farm boundary
 *                 example:
 *                   type: "FeatureCollection"
 *                   features:
 *                     - type: "Feature"
 *                       geometry:
 *                         type: "Polygon"
 *                         coordinates: [[[70.3181, 30.8495], [70.3185, 30.8495], [70.3185, 30.8491], [70.3181, 30.8491], [70.3181, 30.8495]]]
 *               farm_type:
 *                 type: string
 *                 description: Type of the farm (e.g., Crops, Livestock)
 *               ownership_status:
 *                 type: string
 *                 description: Ownership status (e.g., Owned, Leased)
 *               lease_years:
 *                 type: integer
 *                 description: Number of years on lease (if applicable)
 *               lease_months:
 *                 type: integer
 *                 description: Number of months on lease (if applicable)
 *               crop_type:
 *                 type: string
 *                 description: Type of crops grown on the farm
 *               livestock_type:
 *                 type: string
 *                 description: Type of livestock present on the farm
 *               number_of_animals:
 *                 type: integer
 *                 description: Number of animals on the farm (if applicable)
 *               farm_latitude:
 *                 type: number
 *                 format: float
 *                 description: Latitude coordinate of the farm's central point
 *               farm_longitude:
 *                 type: number
 *                 format: float
 *                 description: Longitude coordinate of the farm's central point
 *     responses:
 *       201:
 *         description: Farm created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: ID of the created farm
 *                 farmer_id:
 *                   type: string
 *                   description: Associated farmer ID
 *                 draw_farm:
 *                   type: object
 *                   description: Stored GeoJSON data
 *                 calculated_area:
 *                   type: number
 *                   format: float
 *                   description: Calculated area of the farm in acres
 *       400:
 *         description: Invalid request or farmer does not exist
 *       500:
 *         description: Error creating farm
 */

router.post("/farms", auth, createFarm);
/**
 * @swagger
 * /api/farms:
 *   get:
 *     summary: Get farms with optional filters
 *     tags: [Farms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: farm_id
 *         schema:
 *           type: uuid
 *         description: Optional farm ID to fetch a single farm
 *       - in: query
 *         name: farmer_id
 *         schema:
 *           type: uuid
 *         description: Optional farmer ID to fetch all farms for that farmer
 *       - in: query
 *         name: crop_type
 *         schema:
 *           type: string
 *         description: Optional crop type to filter farms
 *     responses:
 *       200:
 *         description: List of farms based on filters
 *       404:
 *         description: No farms found
 *       500:
 *         description: Error fetching farms
 */
router.get("/farms", getFarms);

module.exports = router;
