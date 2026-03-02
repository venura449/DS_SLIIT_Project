const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const { initializeDatabase } = require('./config/postgres');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const telemedicineRoutes = require('./routes/telemedicineRoutes');
app.use('/api/telemedicine', telemedicineRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'Telemedicine Service is running' });
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

const PORT = process.env.PORT || 3005;

const startServer = async () => {
    await initializeDatabase();
    server.listen(PORT, () => {
        console.log(`Telemedicine Service running on port ${PORT}`);
    });
};

startServer().catch((err) => {
    console.error('Failed to start telemedicine service:', err);
    process.exit(1);
});

module.exports = server;
