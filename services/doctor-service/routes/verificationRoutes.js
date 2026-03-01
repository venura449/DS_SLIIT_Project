const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const { authMiddleware } = require('../middlewares/authMiddleware');

/**
 * Verification Routes
 * All routes under /api/v1/verification
 *
 * Doctor routes require a valid JWT issued by auth-service (authMiddleware).
 * Admin routes (approve/reject) are also protected; add an admin-role check
 * here once role is included in the JWT payload.
 */

// Admin: get all submissions
router.get('/all', authMiddleware, verificationController.getAllSubmissions);

// Doctor-protected routes
router.post('/upload', authMiddleware, verificationController.uploadDocument);
router.get('/documents/:doctorId', authMiddleware, verificationController.getDocuments);
router.get('/status/:doctorId', authMiddleware, verificationController.getStatus);
router.delete('/documents/:documentId', authMiddleware, verificationController.deleteDocument);
router.post('/submit', authMiddleware, verificationController.submitForVerification);

// Admin routes (protected; role enforcement to be added when role is added to JWT)
router.post('/approve/:doctorId', authMiddleware, verificationController.approveVerification);
router.post('/reject/:doctorId', authMiddleware, verificationController.rejectVerification);

module.exports = router;
