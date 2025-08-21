"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const health_simple_1 = __importDefault(require("./routes/health-simple"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8000;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
}));
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api/health', health_simple_1.default);
app.get('/', (req, res) => {
    res.json({
        name: '0gSecura API',
        version: '1.0.0',
        description: 'Security scanner API for 0G blockchain',
        endpoints: {
            health: '/api/health',
            scan: '/api/scan',
            blacklist: '/api/blacklist',
            alerts: '/api/alerts',
        },
        blockchain: {
            network: process.env.OG_NETWORK_NAME || '0G-Galileo-Testnet',
            chainId: process.env.OG_CHAIN_ID || '16601',
        },
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
    });
});
app.listen(PORT, () => {
    console.log(`🚀 0gSecura API server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
exports.default = app;
//# sourceMappingURL=server-simple.js.map