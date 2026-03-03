const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const {insertPayment, getAllPayments, getUserPayments, getPayment, 
    fetchPaymentByAppointmentId, handleStripeWebhook, fetchPaymentsByStatus, removePayment} = require('../controllers/paymentController');

// Payment Controller

// Post requests
router.post('/insertPayment', authMiddleware, insertPayment);

// Get requests
router.get('/getPayments', getAllPayments); 
router.get('/getUserPayments', authMiddleware, getUserPayments);
router.get('/getPayment/:id', authMiddleware, getPayment);
router.get('/getAppointmentPayment', fetchPaymentByAppointmentId);
router.get('/filterByStatus', fetchPaymentsByStatus);

// Delete requests
router.delete('/deletePayment/:id', authMiddleware, removePayment);

// Webhook Controllers
router.post('/webhook', authMiddleware, handleStripeWebhook);
// router.post('/webhook/payhere', paymentController.handlePayHereWebhook);

module.exports = router;
