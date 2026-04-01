const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const client = require('prom-client');
const promRegister = new client.Registry();
client.collectDefaultMetrics({ register: promRegister });

// Load environment variables
dotenv.config();

const { initializeDatabase } = require('./config/postgres');

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
const aiSymptomRoutes = require('./routes/aiSymptomRoutes');
app.use('/', aiSymptomRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'AI Symptom Service is running' });
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

const PORT = process.env.PORT || 3008;

if (require.main === module) {
    const server = app.listen(PORT, async () => {
        console.log(`AI Symptom Service running on port ${PORT}`);
        try {
            await initializeDatabase();
        } catch (err) {
            console.warn('AI DB initialization failed (history will be unavailable):', err.message);
        }
    });
}

module.exports = app;
