const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/stripe', paymentController.handleWebhook);
router.post('/payhere', paymentController.handleWebhook);

module.exports = router;
