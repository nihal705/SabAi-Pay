// backend/middleware/errorHandler.js
// Global error handling middleware

const constants = require('../utils/constants');

class ErrorHandler {
    
    // Main error handler
    static errorHandler(err, req, res, next) {
        console.error('Error:', err);
        
        // Default error
        let statusCode = err.statusCode || constants.HTTP_STATUS.INTERNAL_SERVER;
        let message = err.message || 'Internal server error';
        let errors = err.errors || null;
        
        // Handle specific error types
        if (err.name === 'ValidationError') {
            statusCode = constants.HTTP_STATUS.BAD_REQUEST;
            message = 'Validation error';
            errors = Object.values(err.errors).map(e => e.message);
        }
        
        if (err.name === 'CastError') {
            statusCode = constants.HTTP_STATUS.BAD_REQUEST;
            message = 'Invalid ID format';
        }
        
        if (err.code === 11000) {
            statusCode = constants.HTTP_STATUS.CONFLICT;
            message = 'Duplicate key error';
            const field = Object.keys(err.keyPattern)[0];
            errors = [`${field} already exists`];
        }
        
        if (err.code === 'ER_DUP_ENTRY') {
            statusCode = constants.HTTP_STATUS.CONFLICT;
            message = 'Duplicate entry';
            errors = [err.sqlMessage];
        }
        
        if (err.code === 'ER_NO_REFERENCED_ROW') {
            statusCode = constants.HTTP_STATUS.BAD_REQUEST;
            message = 'Referenced record does not exist';
        }
        
        // Send response
        res.status(statusCode).json({
            success: false,
            message,
            errors,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
    
    // 404 handler
    static notFound(req, res) {
        res.status(constants.HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: 'Resource not found'
        });
    }
    
    // Async handler wrapper to catch errors
    static asyncHandler(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }
    
    // Create custom error
    static createError(message, statusCode = constants.HTTP_STATUS.INTERNAL_SERVER, errors = null) {
        const error = new Error(message);
        error.statusCode = statusCode;
        error.errors = errors;
        return error;
    }
}

module.exports = ErrorHandler;