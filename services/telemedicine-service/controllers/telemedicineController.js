const telemedicineService = require('../services/telemedicineService');

const getSessions = async (req, res) => {
    try {
        const sessions = await telemedicineService.getAllConsultations();
        res.status(200).json({ success: true, data: sessions });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const getSessionById = async (req, res) => {
    try {
        const session = await telemedicineService.getConsultationById(req.params.id);

        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        res.status(200).json({ success: true, data: session });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const createSession = async (req, res) => {
    try {
        const { patientId, doctorId, appointmentId, scheduledAt } = req.body;

        if (!patientId || !doctorId) {
            return res.status(400).json({ success: false, message: 'patientId and doctorId are required' });
        }

        const session = await telemedicineService.createConsultation(
            patientId,
            doctorId,
            appointmentId,
            scheduledAt
        );

        res.status(201).json({ success: true, data: session });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const endSession = async (req, res) => {
    try {
        const session = await telemedicineService.completeConsultation(req.params.id);

        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        res.status(200).json({ success: true, data: session });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};



module.exports = { getSessions, getSessionById, createSession, endSession };
