const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'ai_db',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'password',
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle AI DB client', err);
});

const initializeDatabase = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS symptom_analyses (
            id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id           VARCHAR(255),
            symptoms          TEXT NOT NULL,
            detected_symptoms JSONB,
            possible_conditions JSONB,
            confidence        DECIMAL(5,4),
            recommendation    TEXT,
            raw_response      JSONB,
            analyzed_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_analyses_user ON symptom_analyses(user_id);
        CREATE INDEX IF NOT EXISTS idx_analyses_time ON symptom_analyses(analyzed_at DESC);
    `);
    console.log('AI Symptom DB initialized');
};

const query = async (text, params) => {
    try {
        const result = await pool.query(text, params);
        return result;
    } catch (error) {
        console.error('AI DB query error:', error.message);
        throw error;
    }
};

module.exports = { query, pool, initializeDatabase };
