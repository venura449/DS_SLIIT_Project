const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Public — patients browse doctors without logging in
router.get('/doctors', appointmentController.listDoctors);
router.get('/doctors/:doctorId/slots', appointmentController.getDoctorAvailableSlots);

// Authenticated — patient manages their own bookings
router.post('/', authMiddleware, appointmentController.createBooking);
router.get('/', authMiddleware, appointmentController.getMyBookings);
router.put('/:id/cancel', authMiddleware, appointmentController.cancelBooking);

module.exports = router;
