const express = require('express');
const router = express.Router();
const {insertPayment, handleStripeWebhook} = require('../controllers/paymentController');

// router.get('/', paymentController.getPayments);
// router.get('/:id', paymentController.getPaymentById);
// router.post('/', paymentController.createPayment);

router.post('/webhook', handleStripeWebhook);
router.post('/insertPayment', insertPayment);
// router.post('/webhook/payhere', paymentController.handlePayHereWebhook);

module.exports = router;
