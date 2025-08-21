"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const error_handler_1 = require("@/middleware/error-handler");
const og_blockchain_1 = require("@/lib/og-blockchain");
const phishing_detector_1 = require("@/lib/phishing-detector");
const blacklist_database_1 = require("@/lib/blacklist-database");
const og_compute_1 = require("@/lib/og-compute");
const og_storage_1 = require("@/lib/og-storage");
const validators_1 = require("@/lib/validators");
const router = (0, express_1.Router)();
const scanLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60000,
    max: 10,
    message: {
        error: 'Scan rate limit exceeded. Please wait before scanning again.',
    },
});
router.use(scanLimiter);
router.post('/', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { type, address } = (0, validators_1.validateScanRequest)(req.body);
    let result = {};
    if (type === "token") {
        const [tokenInfo, contractAnalysis, transactionPatterns, liquidityAnalysis, holderAnalysis, honeypotAnalysis, securityScore, blacklistMatches, storageBlacklist,] = await Promise.all([
            og_blockchain_1.ogBlockchain.getTokenInfo(address),
            og_blockchain_1.ogBlockchain.analyzeContract(address),
            og_blockchain_1.ogBlockchain.getTransactionPatterns(address),
            og_blockchain_1.ogBlockchain.analyzeLiquidity(address),
            og_blockchain_1.ogBlockchain.analyzeHolders(address),
            og_blockchain_1.ogBlockchain.detectHoneypot(address),
            og_blockchain_1.ogBlockchain.calculateSecurityScore(address),
            blacklist_database_1.blacklistDatabase.checkBlacklist(address, "address"),
            og_storage_1.ogStorage.searchBlacklist({ value: address, type: "address" }),
        ]);
        let finalAiAnalysis = null;
        try {
            finalAiAnalysis = await og_compute_1.ogCompute.analyzeTokenSecurity({
                address,
                tokenInfo,
                contractAnalysis,
                transactionPatterns,
                liquidityAnalysis,
                holderAnalysis,
                honeypotAnalysis,
            });
        }
        catch (error) {
            console.warn("AI analysis failed:", error);
        }
        let trustScore = finalAiAnalysis
            ? Math.floor((securityScore.overall + (100 - finalAiAnalysis.riskScore)) / 2)
            : securityScore.overall;
        const flags = [
            ...securityScore.factors.positive.map((f) => `✓ ${f}`),
            ...securityScore.factors.negative.map((f) => `⚠ ${f}`),
            ...securityScore.factors.critical.map((f) => `🚨 ${f}`),
        ];
        if (finalAiAnalysis) {
            flags.push(`🤖 AI Confidence: ${finalAiAnalysis.confidence}%`);
            finalAiAnalysis.findings.forEach(finding => {
                flags.push(`🔍 ${finding}`);
            });
        }
        const allBlacklistMatches = [...blacklistMatches, ...storageBlacklist];
        if (allBlacklistMatches.length > 0) {
            trustScore = Math.min(trustScore, 20);
            allBlacklistMatches.forEach((match) => {
                flags.unshift(`🚨 Blacklisted: ${match.description}`);
            });
        }
        const status = trustScore >= 70 ? "safe" : trustScore >= 40 ? "caution" : "danger";
        result = {
            type: "token",
            address,
            trustScore,
            status,
            flags,
            details: {
                contractVerified: contractAnalysis.verified,
                liquidityLocked: liquidityAnalysis.liquidityLocked,
                ownershipRenounced: contractAnalysis.ownershipRenounced,
                tokenInfo,
                contractAnalysis,
                transactionPatterns,
                liquidityAnalysis,
                holderAnalysis,
                honeypotAnalysis,
                securityScore,
                blacklistMatches: allBlacklistMatches,
                aiAnalysis: finalAiAnalysis,
            },
        };
    }
    else if (type === "website") {
        const [phishingAnalysis, blacklistMatches] = await Promise.all([
            phishing_detector_1.phishingDetector.analyzeWebsite(address),
            blacklist_database_1.blacklistDatabase.checkBlacklist(address, "url"),
        ]);
        let trustScore = phishingAnalysis.trustScore;
        const flags = [...phishingAnalysis.flags];
        if (blacklistMatches.length > 0) {
            trustScore = Math.min(trustScore, 10);
            blacklistMatches.forEach((match) => {
                flags.unshift(`🚨 Blacklisted: ${match.description}`);
            });
        }
        const status = trustScore >= 70 ? "safe" : trustScore >= 40 ? "caution" : "danger";
        result = {
            type: "website",
            address: phishingAnalysis.url,
            trustScore,
            status,
            flags,
            details: {
                sslValid: phishingAnalysis.details.sslAnalysis.hasValidChain,
                domainAge: phishingAnalysis.details.domainAnalysis.domainAge,
                phishingMatch: phishingAnalysis.isPhishing,
                phishingAnalysis: phishingAnalysis.details,
                riskScore: phishingAnalysis.riskScore,
                blacklistMatches,
            },
        };
    }
    try {
        await og_storage_1.ogStorage.storeSecurityReport({
            id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: "scan_result",
            data: result,
            metadata: {
                userAgent: req.get('User-Agent'),
                timestamp: new Date().toISOString(),
                scanType: type,
                ip: req.ip,
            },
        });
    }
    catch (error) {
        console.warn("Failed to store scan result:", error);
    }
    res.json(result);
}));
exports.default = router;
//# sourceMappingURL=scan.js.map