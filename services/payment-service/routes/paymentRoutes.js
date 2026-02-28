const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.get('/', paymentController.getPayments);
router.get('/:id', paymentController.getPaymentById);
router.post('/', paymentController.createPayment);

module.exports = router;
