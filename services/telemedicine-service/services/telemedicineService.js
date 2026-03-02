const Consultation = require('../models/Consultation');
const { v4: uuidv4 } = require('uuid');

const buildRoomDetails = () => {
    const roomName = `consultation-${uuidv4()}`;
    const baseUrl = process.env.JITSI_SERVER_URL || '';
    return { roomName, roomUrl: `${baseUrl}${roomName}` };
};

exports.getAllConsultations = async () => {
    return Consultation.findAll({ order: [['createdAt', 'DESC']] });
};

exports.getConsultationById = async (id) => {
    return Consultation.findByPk(id);
};

exports.createConsultation = async (patientId, doctorId, appointmentId, scheduledAt) => {
    const { roomName, roomUrl } = buildRoomDetails();

    const session = await Consultation.create({
        patientId,
        doctorId,
        appointmentId,
        roomName,
        roomUrl,
        status: 'scheduled',
        scheduledAt: scheduledAt || null,
    });

    return session;
};

exports.completeConsultation = async (id) => {
    const session = await Consultation.findByPk(id);
    if (!session) return null;

    session.status = 'completed';
    await session.save();
    return session;
};