"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const error_handler_1 = require("@/middleware/error-handler");
const og_blockchain_1 = require("@/lib/og-blockchain");
const router = (0, express_1.Router)();
router.get('/', (0, error_handler_1.asyncHandler)(async (req, res) => {
    try {
        const startTime = Date.now();
        const blockNumber = await og_blockchain_1.ogBlockchain.getBlockNumber();
        const responseTime = Date.now() - startTime;
        const health = {
            status: "healthy",
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || "1.0.0",
            environment: process.env.NODE_ENV || "development",
            services: {
                blockchain: {
                    status: "connected",
                    blockNumber,
                    network: process.env.OG_NETWORK_NAME || "0G-Galileo-Testnet",
                    chainId: process.env.OG_CHAIN_ID || "16601",
                    responseTime: `${responseTime}ms`,
                },
                storage: {
                    status: process.env.OG_PRIVATE_KEY ? "configured" : "not_configured",
                    indexer: process.env.OG_INDEXER_RPC || "default",
                },
                database: {
                    status: process.env.DATABASE_URL ? "configured" : "not_configured",
                },
            },
            uptime: process.uptime(),
            memory: process.memoryUsage(),
        };
        res.json(health);
    }
    catch (error) {
        const unhealthyResponse = {
            status: "unhealthy",
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : "Unknown error",
            services: {
                blockchain: {
                    status: "disconnected",
                    error: error instanceof Error ? error.message : "Connection failed",
                },
            },
        };
        res.status(503).json(unhealthyResponse);
    }
}));
exports.default = router;
//# sourceMappingURL=health.js.map