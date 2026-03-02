const { Sequelize } = require('sequelize');
require('dotenv').config();

// Initialize Sequelize with PostgreSQL
const sequelize = new Sequelize(
    process.env.DB_NAME || 'telemedicine_db',
    process.env.DB_USER || 'admin',
    process.env.DB_PASSWORD || 'password',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres',
        port: process.env.DB_PORT || 5432,
        logging: false, // Set to console.log to see SQL in terminal
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// Function to test connection and sync models
const initializeDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('Successfully connected to PostgreSQL.');

        // sync() creates tables if they don't exist. 
        // Use { alter: true } during development to update columns automatically.
        await sequelize.sync({ alter: true }); 
        console.log('All database models synchronized.');
    } catch (error) {
        console.error('Database connection error:', error);
        throw error; // Let server.js handle the process exit
    }
};

module.exports = { sequelize, initializeDatabase };