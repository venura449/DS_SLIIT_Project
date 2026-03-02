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
    await pool.query(`
        CREATE TABLE IF NOT EXISTS appointments (
            id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            patient_id       VARCHAR(255) NOT NULL,
            doctor_id        VARCHAR(255) NOT NULL,
            slot_id          UUID,
            appointment_date DATE NOT NULL,
            start_time       TIME NOT NULL,
            end_time         TIME NOT NULL,
            status           VARCHAR(20) DEFAULT 'confirmed'
                             CONSTRAINT chk_appt_status CHECK (status IN ('confirmed','cancelled','completed')),
            reason           TEXT,
            notes            TEXT,
            doctor_name      VARCHAR(255),
            created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE UNIQUE INDEX IF NOT EXISTS idx_uq_active_booking
            ON appointments(doctor_id, appointment_date, start_time)
            WHERE status != 'cancelled';

        CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
        CREATE INDEX IF NOT EXISTS idx_appointments_doctor  ON appointments(doctor_id);
    `);
    console.log('Patient DB tables initialized');
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
