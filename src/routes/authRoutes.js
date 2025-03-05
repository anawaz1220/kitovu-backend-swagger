const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { register, login, resetPassword } = require("../controllers/authController");

router.post("/register", register);
/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Authenticate user
 *     description: Logs in a user and returns an authentication token.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "admin@kitovu.com.ng"
 *               password:
 *                 type: string
 *                 example: "K!tovu@dm!n2024"
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjgwZWQxMzNhLTBlM2EtNDdjNS1iMGY0LTBhODliY2Y4MWUyZCIsImVtYWlsIjoiYWRtaW5Aa2l0b3Z1LmNvbS5uZyIsInJvbGUiOiJhZG1pbmlzdHJhdG9yIiwiaWF0IjoxNzQwOTY1NDM1LCJleHAiOjE3NDA5NjkwMzV9.3Hg5XZTtoDgkGjdd7JcOIq_YBYZ_Qcbv4-1C13EIpHc"
 *                 user:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: "admin@kitovu.com.ng"
 *                     username:
 *                       type: string
 *                       example: "admin"
 *                     role:
 *                       type: string
 *                       example: "admin"
 *                     id:
 *                       type: string
 *                       example: "80ed133a-0e3a-47c5-b0f4-0a89bcf81e2d"
 */

router.post("/login", login);

/**
 * @swagger
 * /api/reset-password:
 *   post:
 *     summary: Reset the logged-in user's password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Current password is incorrect
 *       401:
 *         description: Unauthorized (invalid or missing token)
 *       404:
 *         description: User not found
 */
router.post("/reset-password", auth, resetPassword); // Protect the reset password route with authentication


module.exports = router;