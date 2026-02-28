/**
 * User Model
 * Placeholder for user database schema
 */

const userSchema = {
    id: 'UUID',
    email: 'String (unique)',
    password: 'String (hashed)',
    name: 'String',
    userType: 'Enum (patient, doctor, admin)',
    createdAt: 'Timestamp',
    updatedAt: 'Timestamp',
    // Additional fields
};

module.exports = userSchema;
