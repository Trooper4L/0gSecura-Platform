"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("@/utils/logger");
const error_handler_1 = require("@/middleware/error-handler");
const request_logger_1 = require("@/middleware/request-logger");
const health_1 = __importDefault(require("@/routes/health"));
const scan_1 = __importDefault(require("@/routes/scan"));
const blacklist_1 = __importDefault(require("@/routes/blacklist"));
const alerts_1 = __importDefault(require("@/routes/alerts"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8000;
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
};
app.use((0, cors_1.default)(corsOptions));
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)(process.env.LOG_FORMAT || 'combined', {
        stream: { write: (message) => logger_1.logger.info(message.trim()) }
    }));
}
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    message: {
        error: 'Too many requests from this IP, please try again later',
        retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW || '900000') / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);
app.use(request_logger_1.requestLogger);
app.use('/api/health', health_1.default);
app.use('/api/scan', scan_1.default);
app.use('/api/blacklist', blacklist_1.default);
app.use('/api/alerts', alerts_1.default);
app.get('/', (req, res) => {
    res.json({
        name: '0gSecura API',
        version: '1.0.0',
        description: 'Security scanner API for 0G blockchain',
        docs: '/api/health',
        blockchain: {
            network: process.env.OG_NETWORK_NAME || '0G-Galileo-Testnet',
            chainId: process.env.OG_CHAIN_ID || '16601',
            explorer: process.env.OG_CHAIN_EXPLORER,
        },
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method,
    });
});
app.use(error_handler_1.errorHandler);
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger_1.logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        logger_1.logger.info(`🚀 0gSecura API server running on port ${PORT}`);
        logger_1.logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
        logger_1.logger.info(`🔗 0G Network: ${process.env.OG_NETWORK_NAME || '0G-Galileo-Testnet'}`);
        logger_1.logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);
    });
}
exports.default = app;
//# sourceMappingURL=server.js.map