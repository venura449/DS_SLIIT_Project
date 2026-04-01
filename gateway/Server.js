const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const httpProxy = require('express-http-proxy');
const client = require('prom-client');

// Prometheus metrics setup
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register],
});

const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [register],
});

// Load environment variables
dotenv.config();

const app = express();

// Prometheus metrics middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const route = req.route ? req.route.path : req.path.replace(/\/[0-9a-fA-F-]{24,}/g, '/:id');
        const duration = (Date.now() - start) / 1000;
        httpRequestsTotal.inc({ method: req.method, route, status_code: res.statusCode });
        httpRequestDuration.observe({ method: req.method, route, status_code: res.statusCode }, duration);
    });
    next();
});

// Middleware
app.use(cors());
app.use(morgan('dev'));

// Skip body parsing for multipart routes (file uploads) so the stream passes through intact
const bodyParserExclusions = (req, res, next) => {
    const isMultipart = req.headers['content-type'] && req.headers['content-type'].startsWith('multipart/form-data');
    if (isMultipart) return next();
    express.json()(req, res, (err) => {
        if (err) return next(err);
        express.urlencoded({ extended: true })(req, res, next);
    });
};
app.use(bodyParserExclusions);

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

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
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
