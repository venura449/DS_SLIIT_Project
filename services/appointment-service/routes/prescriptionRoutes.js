const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const {
    createPrescription,
    updatePrescription,
    getDoctorPrescriptions,
    getPatientPrescriptions,
    getPrescriptionByAppointment,
    getPrescriptionById,
} = require('../controllers/prescriptionController');

// Doctor: list all prescriptions they issued
router.get('/doctor', authMiddleware, getDoctorPrescriptions);

// Patient: list all prescriptions for themselves
router.get('/patient', authMiddleware, getPatientPrescriptions);

// Get prescription for a specific appointment (doctor or patient)
router.get('/appointment/:appointmentId', authMiddleware, getPrescriptionByAppointment);

// Get single prescription by ID
router.get('/:id', authMiddleware, getPrescriptionById);

// Doctor: create a prescription
router.post('/', authMiddleware, createPrescription);

// Doctor: update a prescription
router.put('/:id', authMiddleware, updatePrescription);

module.exports = router;
