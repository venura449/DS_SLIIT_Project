const db = require('../config/postgres');

class Payment {

    /**
     * Create a new payment record
     */
    static async create(paymentData) {
        const { appointment_id, patient_id, amount, status = 'PENDING', transaction_id } = paymentData;
        const query = `
            INSERT INTO payments (appointment_id, patient_id, amount, status, transaction_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, appointment_id, patient_id, amount, status, transaction_id, created_at
        `;
        try {
            const result = await db.query(query, [appointment_id, patient_id, amount, status, transaction_id]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find payment by id
     */
    static async findById(id) {
        const query = 'SELECT * FROM payments WHERE id = $1';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    static async updateStatus(id, status, transaction_id) {
        const query = `
            UPDATE payments 
            SET status = $2, transaction_id = $3, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING id, appointment_id, patient_id, amount, status, transaction_id, created_at, updated_at
        `;  
        const result = await db.query(query, [id, status, transaction_id]);
        return result.rows[0];
    }

    static async findByAppointmentId(appointment_id) {
        const query = 'SELECT * FROM payments WHERE appointment_id = $1';
        const result = await db.query(query, [appointment_id]);
        return result.rows[0];
    }

    static async findByPatientId(patient_id) {
        const query = 'SELECT * FROM payments WHERE patient_id = $1';
        const result = await db.query(query, [patient_id]);
        return result.rows;
    }
}

module.exports = Payment;