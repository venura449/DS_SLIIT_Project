const { Pool } = require('pg');
const config = require('./database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const pool = new Pool({
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.username,
    password: dbConfig.password,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

const initializeDatabase = async () => {
    try {
        // Create users table if it doesn't exist
        const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        user_type VARCHAR(50) DEFAULT 'patient',
        gender VARCHAR(20),
        weight NUMERIC(5,2),
        emergency_contact VARCHAR(20),
        address TEXT,
        birthdate DATE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`;

        await pool.query(createTableQuery);
        console.log('Database tables initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
};

const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: result.rowCount });
        return result;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};

const getClient = async () => {
    const client = await pool.connect();
    return client;
};

module.exports = {
    query,
    getClient,
    pool,
    initializeDatabase,
};
