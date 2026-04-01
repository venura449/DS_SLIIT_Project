const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const client = require('prom-client');
const promRegister = new client.Registry();
client.collectDefaultMetrics({ register: promRegister });
const { initializeProducer, disconnectProducer } = require('./config/kafka');
const { initializeDatabase } = require('./config/postgres');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const internalRoutes = require('./routes/internalRoutes');
app.use('/api/v1', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/internal', internalRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'Auth Service is running' });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', promRegister.contentType);
    res.end(await promRegister.metrics());
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

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, async () => {
    console.log(`Auth Service running on port ${PORT}`);
    try {
        // Initialize database
        await initializeDatabase();
        console.log('Database initialized successfully');

        // Initialize Kafka producer
        await initializeProducer();
        console.log('Kafka producer initialized successfully');
    } catch (error) {
        console.error('Failed to start auth service:', error);
        process.exit(1);
    }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(async () => {
        console.log('HTTP server closed');
        await disconnectProducer();
        process.exit(0);
    });
});

module.exports = server;
