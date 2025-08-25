const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { 
  getStates, 
  getLGAs, 
  getCities 
} = require("../controllers/dropdownController");

/**
 * @swagger
 * tags:
 *   name: Dropdowns
 *   description: APIs for dropdown data from farmer records
 */

/**
 * @swagger
 * /api/dropdowns/states:
 *   get:
 *     summary: Get unique list of states from farmer records
 *     tags: [Dropdowns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of unique states
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   value:
 *                     type: string
 *                     description: State value
 *                     example: "abia"
 *                   label:
 *                     type: string
 *                     description: State display name
 *                     example: "Abia"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/dropdowns/states", auth, getStates);

/**
 * @swagger
 * /api/dropdowns/lgas:
 *   get:
 *     summary: Get unique list of LGAs from farmer records
 *     tags: [Dropdowns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Filter LGAs by state (optional)
 *         example: "abia"
 *     responses:
 *       200:
 *         description: List of unique LGAs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   value:
 *                     type: string
 *                     description: LGA value
 *                     example: "aba_north"
 *                   label:
 *                     type: string
 *                     description: LGA display name
 *                     example: "Aba North"
 *                   state:
 *                     type: string
 *                     description: Associated state
 *                     example: "abia"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/dropdowns/lgas", auth, getLGAs);

/**
 * @swagger
 * /api/dropdowns/cities:
 *   get:
 *     summary: Get unique list of cities/wards from farmer records
 *     tags: [Dropdowns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Filter cities by state (optional)
 *         example: "abia"
 *       - in: query
 *         name: lga
 *         schema:
 *           type: string
 *         description: Filter cities by LGA (optional)
 *         example: "isiala_ngwa_north"
 *     responses:
 *       200:
 *         description: List of unique cities/wards
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   value:
 *                     type: string
 *                     description: City/ward value
 *                     example: "ward_1"
 *                   label:
 *                     type: string
 *                     description: City/ward display name
 *                     example: "Ward 1"
 *                   state:
 *                     type: string
 *                     description: Associated state
 *                     example: "abia"
 *                   lga:
 *                     type: string
 *                     description: Associated LGA
 *                     example: "aba_north"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/dropdowns/cities", auth, getCities);

module.exports = router;