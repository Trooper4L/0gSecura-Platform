"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const error_handler_1 = require("@/middleware/error-handler");
const blacklist_database_1 = require("@/lib/blacklist-database");
const og_storage_1 = require("@/lib/og-storage");
const validators_1 = require("@/lib/validators");
const router = (0, express_1.Router)();
const reportLimiter = (0, express_rate_limit_1.default)({
    windowMs: 300000,
    max: 5,
    message: {
        error: 'Report rate limit exceeded. Please wait before submitting another report.',
    },
});
router.get('/', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { limit, offset } = (0, validators_1.validatePaginationParams)(req.query);
    const query = {
        type: req.query.type || undefined,
        category: req.query.category || undefined,
        severity: req.query.severity || undefined,
        source: req.query.source || undefined,
        status: req.query.status || undefined,
        search: req.query.search || undefined,
        limit,
        offset,
    };
    const [localResult, storageData] = await Promise.all([
        blacklist_database_1.blacklistDatabase.getAllEntries(query),
        og_storage_1.ogStorage.searchBlacklist({
            type: query.type,
            category: query.category,
            severity: query.severity,
            value: query.search,
        })
    ]);
    const allEntries = [
        ...localResult.entries,
        ...storageData.map(entry => ({
            ...entry,
            reportedBy: "0G Network",
            status: entry.verified ? "active" : "pending",
            confidence: 90,
            upvotes: 0,
            downvotes: 0,
            tags: [],
        }))
    ];
    const uniqueEntries = allEntries.filter((entry, index, self) => index === self.findIndex(e => e.value === entry.value));
    const result = {
        entries: uniqueEntries.slice(offset, offset + limit),
        total: uniqueEntries.length,
        hasMore: offset + limit < uniqueEntries.length,
    };
    res.json(result);
}));
router.post('/', reportLimiter, (0, error_handler_1.asyncHandler)(async (req, res) => {
    const validatedData = (0, validators_1.validateBlacklistEntry)(req.body);
    const entry = await blacklist_database_1.blacklistDatabase.addBlacklistEntry({
        ...validatedData,
        reportedBy: req.body.reportedBy || 'Anonymous',
        evidence: req.body.evidence || [],
        status: "pending",
        confidence: 50,
        tags: req.body.tags || [],
        relatedEntries: req.body.relatedEntries || [],
    });
    try {
        await og_storage_1.ogStorage.uploadBlacklistData([{
                id: entry.id,
                type: entry.type,
                value: entry.value,
                category: entry.category,
                severity: entry.severity,
                source: entry.source,
                description: entry.description,
                evidence: entry.evidence,
                timestamp: entry.timestamp,
                verified: entry.source === "expert" || entry.source === "automated",
            }]);
    }
    catch (storageError) {
        console.warn("Failed to store in 0G Storage:", storageError);
    }
    res.status(201).json({ entry });
}));
router.get('/stats', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const stats = await blacklist_database_1.blacklistDatabase.getStats();
    res.json({ stats });
}));
router.get('/check', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { value, type } = req.query;
    if (!value || !type) {
        return res.status(400).json({
            error: 'Missing required parameters: value and type',
            required: ['value', 'type']
        });
    }
    const [localMatches, storageMatches] = await Promise.all([
        blacklist_database_1.blacklistDatabase.checkBlacklist(value, type),
        og_storage_1.ogStorage.searchBlacklist({ value, type })
    ]);
    const allMatches = [...localMatches, ...storageMatches];
    const isBlacklisted = allMatches.length > 0;
    res.json({
        blacklisted: isBlacklisted,
        matches: allMatches,
        riskLevel: isBlacklisted
            ? Math.max(...allMatches.map(m => m.severity === 'critical' ? 100 : m.severity === 'high' ? 75 : 50))
            : 0
    });
}));
exports.default = router;
//# sourceMappingURL=blacklist.js.map