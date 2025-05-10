const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getCropHealth } = require("../controllers/advisoryController");

/**
 * @swagger
 * /api/advisory/crop_health/{farm_id}:
 *   get:
 *     summary: Analyzes crop vitality using satellite imagery (NDVI) and provides a health assessment
 *     tags: [Advisory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: farm_id
 *         required: true
 *         description: Unique identifier for the farm
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Crop health analysis
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CropHealthResponse'
 *       404:
 *         description: Farm not found
 *       500:
 *         description: Error analyzing crop health
 */
router.get("/advisory/crop_health/:farm_id", auth, getCropHealth);

module.exports = router;