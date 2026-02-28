const db = require('../config/postgres');
const bcrypt = require('bcryptjs');

class User {
    /**
     * Create a new user
     */
    static async create(userData) {
        const { email, password, name, phone, userType = 'patient' } = userData;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO users (email, password, name, phone, user_type)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, email, name, phone, user_type, created_at
        `;

        try {
            const result = await db.query(query, [email, hashedPassword, name, phone, userType]);
            return result.rows[0];
        } catch (error) {
            if (error.code === '23505') {
                // Unique constraint violation
                throw new Error('Email already exists');
            }
            throw error;
        }
    }

    /**
     * Find user by email
     */
    static async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await db.query(query, [email]);
        return result.rows[0];
    }

    /**
     * Find user by id
     */
    static async findById(id) {
        const query = 'SELECT id, email, name, phone, user_type, is_active, created_at FROM users WHERE id = $1';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Update user
     */
    static async update(id, userData) {
        const { name, phone, userType } = userData;

        const query = `
            UPDATE users 
            SET name = COALESCE($2, name), 
                phone = COALESCE($3, phone),
                user_type = COALESCE($4, user_type),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING id, email, name, phone, user_type, updated_at
        `;

        const result = await db.query(query, [id, name, phone, userType]);
        return result.rows[0];
    }

    /**
     * Verify password
     */
    static async verifyPassword(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    }

    /**
     * Check if user exists
     */
    static async exists(email) {
        const query = 'SELECT id FROM users WHERE email = $1 LIMIT 1';
        const result = await db.query(query, [email]);
        return result.rows.length > 0;
    }

    /**
     * Delete user (soft delete)
     */
    static async deactivate(id) {
        const query = `
            UPDATE users 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING id
        `;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Get all users (with pagination)
     */
    static async findAll(limit = 10, offset = 0) {
        const query = `
            SELECT id, email, name, phone, user_type, is_active, created_at 
            FROM users 
            WHERE is_active = true
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
        `;
        const result = await db.query(query, [limit, offset]);
        return result.rows;
    }
}

module.exports = User;
