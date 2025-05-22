// Update to farmerRoutes.js - focusing on POST and PUT operations
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const upload = require("../middleware/multer");
const farmerController = require("../controllers/farmerController");

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
router.get("/farmers", auth, farmerController.getFarmers);

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
 *                 example: "John"
 *               last_name:
 *                 type: string
 *                 example: "Doe"
 *               gender:
 *                 type: string
 *                 example: "Male"
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-01"
 *               phone_number:
 *                 type: string
 *                 example: "08012345678"
 *               alternate_phone_number:
 *                 type: string
 *                 example: "08087654321"
 *               street_address:
 *                 type: string
 *                 example: "123 Main Street"
 *               state:
 *                 type: string
 *                 example: "Lagos"
 *               lga:
 *                 type: string
 *                 example: "Ikeja"
 *               ward:
 *                 type: string
 *                 example: "Ward 5"
 *               id_type:
 *                 type: string
 *                 example: "Voter's Card"
 *               id_number:
 *                 type: string
 *                 example: "A1234567"
 *               user_latitude:
 *                 type: number
 *                 format: double
 *                 example: 6.5244
 *               user_longitude:
 *                 type: number
 *                 format: double
 *                 example: 3.3792
 *               remarks:
 *                 type: string
 *                 example: "Active farmer"
 *               created_by:
 *                 type: string
 *                 example: "admin"
 *               farmer_picture:
 *                 type: string
 *                 format: binary
 *               id_document_picture:
 *                 type: string
 *                 format: binary
 *               # New fields
 *               education:
 *                 type: string
 *                 example: "Secondary"
 *               agricultural_training:
 *                 type: boolean
 *                 example: true
 *               training_provider:
 *                 type: string
 *                 example: "Agriculture Extension Program"
 *               certificate_issued:
 *                 type: boolean
 *                 example: true
 *               received_financing:
 *                 type: boolean
 *                 example: false
 *               finance_provider:
 *                 type: string
 *                 example: "Agricultural Bank"
 *               finance_amount:
 *                 type: number
 *                 format: double
 *                 example: 50000.00
 *               interest_rate:
 *                 type: number
 *                 format: double
 *                 example: 5.5
 *               financing_duration_years:
 *                 type: integer
 *                 example: 2
 *               financing_duration_months:
 *                 type: integer
 *                 example: 6
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
  auth,
  upload.fields([
    { name: "farmer_picture", maxCount: 1 },
    { name: "id_document_picture", maxCount: 1 },
  ]),
  farmerController.createFarmer
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
 *                 example: "John"
 *               last_name:
 *                 type: string
 *                 example: "Doe"
 *               gender:
 *                 type: string
 *                 example: "Male"
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-01"
 *               phone_number:
 *                 type: string
 *                 example: "08012345678"
 *               alternate_phone_number:
 *                 type: string
 *                 example: "08087654321"
 *               street_address:
 *                 type: string
 *                 example: "123 Main Street"
 *               state:
 *                 type: string
 *                 example: "Lagos"
 *               lga:
 *                 type: string
 *                 example: "Ikeja"
 *               ward:
 *                 type: string
 *                 example: "Ward 5"
 *               id_type:
 *                 type: string
 *                 example: "Voter's Card"
 *               id_number:
 *                 type: string
 *                 example: "A1234567"
 *               user_latitude:
 *                 type: number
 *                 format: double
 *                 example: 6.5244
 *               user_longitude:
 *                 type: number
 *                 format: double
 *                 example: 3.3792
 *               remarks:
 *                 type: string
 *                 example: "Active farmer"
 *               created_by:
 *                 type: string
 *                 example: "admin"
 *               farmer_picture:
 *                 type: string
 *                 format: binary
 *               id_document_picture:
 *                 type: string
 *                 format: binary
 *               # New fields
 *               education:
 *                 type: string
 *                 example: "Secondary"
 *               agricultural_training:
 *                 type: boolean
 *                 example: true
 *               training_provider:
 *                 type: string
 *                 example: "Agriculture Extension Program"
 *               certificate_issued:
 *                 type: boolean
 *                 example: true
 *               received_financing:
 *                 type: boolean
 *                 example: false
 *               finance_provider:
 *                 type: string
 *                 example: "Agricultural Bank"
 *               finance_amount:
 *                 type: number
 *                 format: double
 *                 example: 50000.00
 *               interest_rate:
 *                 type: number
 *                 format: double
 *                 example: 5.5
 *               financing_duration_years:
 *                 type: integer
 *                 example: 2
 *               financing_duration_months:
 *                 type: integer
 *                 example: 6
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
  auth,
  upload.fields([
    { name: "farmer_picture", maxCount: 1 },
    { name: "id_document_picture", maxCount: 1 },
  ]),
  farmerController.updateFarmer
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
router.delete("/farmers/:id", auth, farmerController.deleteFarmer);

module.exports = router;