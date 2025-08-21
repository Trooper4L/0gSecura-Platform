"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageError = exports.BlockchainError = exports.ValidationError = void 0;
exports.errorHandler = errorHandler;
exports.asyncHandler = asyncHandler;
const logger_1 = require("@/utils/logger");
class ValidationError extends Error {
    statusCode = 400;
    field;
    constructor(message, field) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
    }
}
exports.ValidationError = ValidationError;
class BlockchainError extends Error {
    statusCode = 503;
    constructor(message) {
        super(message);
        this.name = 'BlockchainError';
    }
}
exports.BlockchainError = BlockchainError;
class StorageError extends Error {
    statusCode = 502;
    constructor(message) {
        super(message);
        this.name = 'StorageError';
    }
}
exports.StorageError = StorageError;
function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }
    logger_1.logger.error('API Error:', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });
    const statusCode = err.statusCode || 500;
    const errorResponse = {
        error: err.message || 'Internal server error',
        timestamp: new Date().toISOString(),
        path: req.url,
        method: req.method,
    };
    if (err.field) {
        errorResponse.field = err.field;
    }
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
    }
    res.status(statusCode).json(errorResponse);
}
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
//# sourceMappingURL=error-handler.js.map