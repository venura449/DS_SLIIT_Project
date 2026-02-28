const express = require('express');
const router = express.Router();
const telemedicineController = require('../controllers/telemedicineController');

router.get('/', telemedicineController.getSessions);
router.get('/:id', telemedicineController.getSessionById);
router.post('/', telemedicineController.createSession);
router.put('/:id/end', telemedicineController.endSession);

module.exports = router;
