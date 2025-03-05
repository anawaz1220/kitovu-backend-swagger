const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getDistinctCooperativeNames,
  updateFarmerAffiliation,
} = require("../controllers/farmerAffiliationController");


/**
 * @swagger
 * /api/cooperative-names:
 *   get:
 *     summary: Get list of unique farmer affiliations
 *     tags: [Farmer Affiliation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of distinct cooperative names
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: The name of the cooperative
 *                     example: Cooperative A
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       500:
 *         description: Internal server error
 */
router.get("/cooperative-names", auth, getDistinctCooperativeNames);

/**
 * @swagger
 * /api/farmer-affiliation:
 *   put:
 *     summary: Update or create a farmer's affiliation with a cooperative
 *     tags: [Farmer Affiliation]
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
 *                 format: uuid
 *                 description: The ID of the farmer
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               member_of_cooperative:
 *                 type: boolean
 *                 description: Whether the farmer is a member of a cooperative
 *                 example: true
 *               name:
 *                 type: string
 *                 description: The name of the cooperative
 *                 example: Cooperative A
 *               activities:
 *                 type: string
 *                 description: Activities of the cooperative
 *                 example: Farming, Marketing
 *     responses:
 *       200:
 *         description: Farmer affiliation updated or created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FarmerAffiliation'
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       500:
 *         description: Internal server error
 */

router.put("/farmer-affiliation", auth, updateFarmerAffiliation); // Add the update endpoint

module.exports = router;