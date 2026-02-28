const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const httpProxy = require('express-http-proxy');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Service Routes
app.use('/auth', httpProxy(process.env.AUTH_SERVICE_URL || 'http://localhost:3001'));
app.use('/patients', httpProxy(process.env.PATIENT_SERVICE_URL || 'http://localhost:3002'));
app.use('/doctors', httpProxy(process.env.DOCTOR_SERVICE_URL || 'http://localhost:3003'));
app.use('/appointments', httpProxy(process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3004'));
app.use('/telemedicine', httpProxy(process.env.TELEMEDICINE_SERVICE_URL || 'http://localhost:3005'));
app.use('/payments', httpProxy(process.env.PAYMENT_SERVICE_URL || 'http://localhost:3006'));
app.use('/notifications', httpProxy(process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007'));
app.use('/ai-symptoms', httpProxy(process.env.AI_SERVICE_URL || 'http://localhost:3008'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'API Gateway is running' });
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

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});

module.exports = server;
