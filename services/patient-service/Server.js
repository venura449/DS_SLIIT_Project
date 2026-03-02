const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { initializeDatabase } = require('./config/postgres');

// Load environment variables
dotenv.config();

const app = express();

// Serve medical record uploads as static files
// Gateway: /patients/uploads/* → patient-service /uploads/*
const UPLOAD_BASE = process.env.UPLOAD_BASE || path.join(__dirname, 'uploads');
app.use('/uploads', express.static(UPLOAD_BASE));

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const patientRoutes = require('./routes/patientRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
app.use('/api/patients', patientRoutes);
app.use('/api/v1/medical-records', medicalRecordRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'Patient Service is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error', error: err.message });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 3002;

const server = app.listen(PORT, async () => {
    console.log(`Patient Service running on port ${PORT}`);
    try {
        await initializeDatabase();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }
});

module.exports = server;
