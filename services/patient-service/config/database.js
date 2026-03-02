const { Sequelize } = require('sequelize');
require('dotenv').config(); // Load variables from .env file

const sequelize = new Sequelize(
    process.env.DB_NAME || 'patient_db', 
    process.env.DB_USER || 'postgres', 
    process.env.DB_PASSWORD || 'password', 
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres',
        logging: false, // Set to console.log to see SQL queries in terminal
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL connected successfully.');
        
        // sync({ force: false }) creates tables if they don't exist 
        // without dropping existing data
        await sequelize.sync({ force: false }); 
        console.log('Database models synchronized.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };