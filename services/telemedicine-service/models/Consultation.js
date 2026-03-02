const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Consultation = sequelize.define('Consultation', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    patientId: { type: DataTypes.UUID, allowNull: false },
    doctorId: { type: DataTypes.UUID, allowNull: false },
    appointmentId: { type: DataTypes.UUID },
    roomName: { type: DataTypes.STRING, allowNull: false }, // The unique Jitsi ID
    roomUrl: { type: DataTypes.STRING }, // The full clickable link
    status: { 
        type: DataTypes.ENUM('scheduled', 'active', 'completed'), 
        defaultValue: 'scheduled' 
    },
    scheduledAt: { type: DataTypes.DATE }
});

module.exports = Consultation;