const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const { insertPayment, getAllPayments, getUserPayments, getPayment,
    fetchPaymentByAppointmentId, handleStripeWebhook, fetchPaymentsByStatus, removePayment,
    getAdminStats, confirmPayment, getDoctorRevenue } = require('../controllers/paymentController');

// Payment Controller

// Admin stats
router.get('/admin/stats', authMiddleware, getAdminStats);

// Doctor revenue (slot-based, filtered by period)
router.get('/doctor/revenue', authMiddleware, getDoctorRevenue);

// Post requests
router.post('/insertPayment', authMiddleware, insertPayment);
router.patch('/payments/:id/confirm', authMiddleware, confirmPayment);

// Get requests
router.get('/getPayments', authMiddleware, getAllPayments);
router.get('/getUserPayments', authMiddleware, getUserPayments);
router.get('/getPayment/:id', authMiddleware, getPayment);
router.get('/getAppointmentPayment', fetchPaymentByAppointmentId);
router.get('/filterByStatus', authMiddleware, fetchPaymentsByStatus);

// Delete requests
router.delete('/deletePayment/:id', authMiddleware, removePayment);

// Webhook Controllers — Stripe sends raw POST with no JWT, must NOT use authMiddleware
router.post('/webhook', handleStripeWebhook);
// router.post('/webhook/payhere', paymentController.handlePayHereWebhook);

module.exports = router;
