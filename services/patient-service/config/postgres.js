const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'patient_db',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'password',
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle patient DB client', err);
    process.exit(-1);
});

const initializeDatabase = async () => {
    // Patient profile tables will be added here as the patient service is built out
    console.log('Patient DB initialized');
};

const query = async (text, params) => {
    try {
        const result = await pool.query(text, params);
        return result;
    } catch (error) {
        console.error('Patient DB query error:', error.message);
        throw error;
    }
};

module.exports = { query, pool, initializeDatabase };
