const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth"); // Import the auth middleware

const upload = require("../middleware/multer");
const { getFarmers, createFarmer, updateFarmer, deleteFarmer } = require("../controllers/farmerController");
router.use(auth);


/**
 * @swagger
 * tags:
 *   name: Farmers
 *   description: Farmer management
 */

/**
 * @swagger
 * /api/farmers:
 *   get:
 *     summary: Get all farmers or a specific farmer
 *     tags: [Farmers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: farmer_id
 *         schema:
 *           type: string
 *         required: false
 *         description: ID of the farmer to fetch a specific record
 *     responses:
 *       200:
 *         description: List of farmers or a single farmer
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Farmer'
 */
router.get("/farmers", auth, getFarmers);

/**
 * @swagger
 * /api/farmers:
 *   post:
 *     summary: Create a new farmer
 *     tags: [Farmers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               gender:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               phone_number:
 *                 type: string
 *               alternate_phone_number:
 *                 type: string
 *               street_address:
 *                 type: string
 *               state:
 *                 type: string
 *               lga:
 *                 type: string
 *               city:
 *                 type: string
 *               id_type:
 *                 type: string
 *               id_number:
 *                 type: string
 *               user_latitude:
 *                 type: number
 *                 format: double
 *               user_longitude:
 *                 type: number
 *                 format: double
 *               remarks:
 *                 type: string
 *               created_by:
 *                 type: string
 *               validation_time:
 *                 type: string
 *                 format: date-time
 *               validation_status:
 *                 type: string
 *               validated_by:
 *                 type: string
 *               farmer_picture:
 *                 type: string
 *                 format: binary
 *               id_document_picture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Farmer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Farmer'
 */
router.post(
  "/farmers",
  upload.fields([
    { name: "farmer_picture", maxCount: 1 },
    { name: "id_document_picture", maxCount: 1 },
  ]),
  createFarmer
);

/**
 * @swagger
 * /api/farmers/{id}:
 *   put:
 *     summary: Update a farmer by ID
 *     tags: [Farmers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Farmer ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               gender:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               phone_number:
 *                 type: string
 *               alternate_phone_number:
 *                 type: string
 *               street_address:
 *                 type: string
 *               state:
 *                 type: string
 *               lga:
 *                 type: string
 *               city:
 *                 type: string
 *               id_type:
 *                 type: string
 *               id_number:
 *                 type: string
 *               user_latitude:
 *                 type: number
 *                 format: double
 *               user_longitude:
 *                 type: number
 *                 format: double
 *               remarks:
 *                 type: string
 *               created_by:
 *                 type: string
 *               validation_time:
 *                 type: string
 *                 format: date-time
 *               validation_status:
 *                 type: string
 *               validated_by:
 *                 type: string
 *               farmer_picture:
 *                 type: string
 *                 format: binary
 *               id_document_picture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Farmer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Farmer'
 *       404:
 *         description: Farmer not found
 */

router.put(
  "/farmers/:id",
  upload.fields([
    { name: "farmer_picture", maxCount: 1 },
    { name: "id_document_picture", maxCount: 1 },
  ]),
  updateFarmer
);

/**
 * @swagger
 * /api/farmers/{id}:
 *   delete:
 *     summary: Delete a farmer by ID
 *     tags: [Farmers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Farmer ID
 *     responses:
 *       204:
 *         description: Farmer deleted successfully
 *       404:
 *         description: Farmer not found
 */
router.delete("/farmers/:id", deleteFarmer);

module.exports = router;