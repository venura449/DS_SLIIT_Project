const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/telemedicineController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Internal — called by appointment-service on approval (no auth)
router.post('/sessions', ctrl.createSession);

// Authenticated routes
// NOTE: /sessions/appointment/:id must be declared before /sessions/:id
router.get('/sessions/appointment/:appointmentId', authMiddleware, ctrl.getSessionByAppointment);
router.get('/sessions/:id', authMiddleware, ctrl.getSessionById);
router.get('/sessions', authMiddleware, ctrl.getSessions);
router.put('/sessions/:id/end', authMiddleware, ctrl.endSession);

module.exports = router;
