const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const { initializeDatabase } = require('./config/postgres');
const { initializeProducer, disconnectProducer } = require('./config/kafka');
const { startReminderScheduler } = require('./services/reminderScheduler');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const appointmentRoutes = require('./routes/appointmentRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/prescriptions', prescriptionRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'Appointment Service is running' });
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

const PORT = process.env.PORT || 3004;

const server = app.listen(PORT, async () => {
    console.log(`Appointment Service running on port ${PORT}`);
    try {
        await initializeDatabase();
        console.log('Database initialized successfully');
        await initializeProducer();
        startReminderScheduler();
    } catch (error) {
        console.error('Failed to initialize services:', error);
        process.exit(1);
    }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(async () => {
        await disconnectProducer();
        process.exit(0);
    });
});

module.exports = server;
