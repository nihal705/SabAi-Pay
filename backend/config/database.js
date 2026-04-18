// backend/config/database.js
const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'sabai_pay',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    timezone: '+05:30'
});

const promisePool = pool.promise();

// Test connection
const testConnection = async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('✅ MySQL Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ MySQL Database connection failed:', error.message);
        return false;
    }
};

// Execute query helper
const executeQuery = async (query, params = []) => {
    try {
        const [rows] = await promisePool.execute(query, params);
        return { success: true, data: rows };
    } catch (error) {
        console.error('Database query error:', error);
        return { success: false, error: error.message };
    }
};

// Get single row
const getOne = async (query, params = []) => {
    const result = await executeQuery(query, params);
    if (result.success && result.data.length > 0) {
        return { success: true, data: result.data[0] };
    }
    return { success: false, data: null };
};

// Begin transaction
const beginTransaction = async () => {
    const connection = await promisePool.getConnection();
    await connection.beginTransaction();
    return connection;
};

module.exports = {
    pool: promisePool,
    testConnection,
    executeQuery,
    getOne,
    beginTransaction
};