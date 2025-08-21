"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const health = {
            status: "healthy",
            timestamp: new Date().toISOString(),
            version: "1.0.0",
            environment: process.env.NODE_ENV || "development",
            services: {
                backend: "running",
                database: process.env.DATABASE_URL ? "configured" : "not_configured",
            },
        };
        res.json(health);
    }
    catch (error) {
        res.status(503).json({
            status: "unhealthy",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.default = router;
//# sourceMappingURL=health-simple.js.map