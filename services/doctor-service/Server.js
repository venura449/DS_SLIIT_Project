const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { initializeDatabase } = require('./config/postgres');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for uploaded documents
const uploadsDir = process.env.UPLOAD_DIR || '/uploads/doctor-verification';
app.use('/uploads/doctor-verification', express.static(uploadsDir));

// Routes
const doctorRoutes = require('./routes/doctorRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
app.use('/api/doctors', doctorRoutes);
app.use('/api/v1/verification', verificationRoutes);
app.use('/api/v1/schedule', scheduleRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'Doctor Service is running' });
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

const PORT = process.env.PORT || 3003;

const server = app.listen(PORT, async () => {
    console.log(`Doctor Service running on port ${PORT}`);
    try {
        await initializeDatabase();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }
});

module.exports = server;
