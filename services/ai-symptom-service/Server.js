const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
const aiSymptomRoutes = require('./routes/aiSymptomRoutes');
app.use('/api/ai-symptoms', aiSymptomRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'AI Symptom Service is running' });
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

const server = app.listen(PORT, () => {
    console.log(`AI Symptom Service running on port ${PORT}`);
});

module.exports = server;
