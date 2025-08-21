"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
const logger_1 = require("@/utils/logger");
function requestLogger(req, res, next) {
    const startTime = Date.now();
    logger_1.logger.info('Incoming request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
    });
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger_1.logger.info('Request completed', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
        });
    });
    next();
}
//# sourceMappingURL=request-logger.js.map