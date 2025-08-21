"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const error_handler_1 = require("@/middleware/error-handler");
const alert_system_1 = require("@/lib/alert-system");
const og_storage_1 = require("@/lib/og-storage");
const og_compute_1 = require("@/lib/og-compute");
const validators_1 = require("@/lib/validators");
const router = (0, express_1.Router)();
const reportLimiter = (0, express_rate_limit_1.default)({
    windowMs: 300000,
    max: 5,
    message: {
        error: 'Alert rate limit exceeded. Please wait before submitting another alert.',
    },
});
router.get('/', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const type = req.query.type;
    const severity = req.query.severity;
    const status = req.query.status;
    const limit = req.query.limit;
    const filters = {
        ...(type && { type }),
        ...(severity && { severity }),
        ...(status && { status }),
        ...(limit && { limit: parseInt(limit) }),
    };
    const alerts = await alert_system_1.alertSystem.getAllAlerts(filters);
    res.json({ alerts });
}));
router.post('/', reportLimiter, (0, error_handler_1.asyncHandler)(async (req, res) => {
    const validatedData = (0, validators_1.validateAlertData)(req.body);
    let aiAnalysis = null;
    try {
        aiAnalysis = await og_compute_1.ogCompute.analyzeTokenSecurity({
            address: validatedData.affectedAddress,
            type: validatedData.type,
            description: validatedData.description,
        });
    }
    catch (error) {
        console.warn("AI analysis failed:", error);
    }
    const alert = await alert_system_1.alertSystem.createAlert({
        ...validatedData,
        status: "active",
        affectedUsers: 0,
        evidence: aiAnalysis ? [{
                type: "ai_analysis",
                data: aiAnalysis,
                timestamp: new Date().toISOString(),
                description: `AI analysis: ${aiAnalysis.confidence}% confidence, risk score ${aiAnalysis.riskScore}`,
            }] : [],
        tags: validatedData.tags || [],
        verificationStatus: aiAnalysis && aiAnalysis.confidence > 90 ? "community-verified" : "unverified",
    });
    try {
        await og_storage_1.ogStorage.uploadThreatIntelligence([{
                id: alert.id,
                threatType: alert.type,
                indicators: [alert.affectedAddress],
                description: alert.description,
                severity: alert.severity,
                confidence: aiAnalysis?.confidence || 50,
                source: alert.reportedBy,
                firstSeen: alert.timestamp,
                lastSeen: alert.timestamp,
                references: [],
            }]);
    }
    catch (error) {
        console.warn("Failed to store threat intelligence:", error);
    }
    res.status(201).json({ alert });
}));
router.get('/stats', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const stats = await alert_system_1.alertSystem.getAlertStats();
    res.json({ stats });
}));
router.get('/:id', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const alert = await alert_system_1.alertSystem.getAlertById(id);
    if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
    }
    res.json({ alert });
}));
router.patch('/:id', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { action, ...data } = req.body;
    if (action === "vote") {
        const success = await alert_system_1.alertSystem.voteOnAlert(id, data.vote);
        if (!success) {
            return res.status(404).json({ error: "Alert not found" });
        }
        return res.json({ success: true });
    }
    if (action === "update-status") {
        const success = await alert_system_1.alertSystem.updateAlertStatus(id, data.status);
        if (!success) {
            return res.status(404).json({ error: "Alert not found" });
        }
        return res.json({ success: true });
    }
    if (action === "add-evidence") {
        const success = await alert_system_1.alertSystem.addEvidence(id, data.evidence);
        if (!success) {
            return res.status(404).json({ error: "Alert not found" });
        }
        return res.json({ success: true });
    }
    res.status(400).json({ error: "Invalid action" });
}));
exports.default = router;
//# sourceMappingURL=alerts.js.map