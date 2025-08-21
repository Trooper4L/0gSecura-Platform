"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportRateLimiter = exports.scanRateLimiter = exports.apiRateLimiter = void 0;
exports.getClientIdentifier = getClientIdentifier;
exports.createRateLimitResponse = createRateLimitResponse;
exports.withRateLimit = withRateLimit;
const server_1 = require("next/server");
class RateLimiter {
    requests = new Map();
    config;
    constructor(config) {
        this.config = {
            windowMs: config.windowMs,
            maxRequests: config.maxRequests,
            message: config.message || "Too many requests, please try again later",
        };
    }
    isRateLimited(identifier) {
        const now = Date.now();
        const record = this.requests.get(identifier);
        if (!record || now > record.resetTime) {
            this.requests.set(identifier, {
                count: 1,
                resetTime: now + this.config.windowMs,
            });
            return { limited: false };
        }
        if (record.count >= this.config.maxRequests) {
            return { limited: true, resetTime: record.resetTime };
        }
        record.count++;
        this.requests.set(identifier, record);
        return { limited: false };
    }
    cleanup() {
        const now = Date.now();
        for (const [key, record] of this.requests.entries()) {
            if (now > record.resetTime) {
                this.requests.delete(key);
            }
        }
    }
}
exports.apiRateLimiter = new RateLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || "900000"),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || "100"),
    message: "API rate limit exceeded. Please try again in a few minutes.",
});
exports.scanRateLimiter = new RateLimiter({
    windowMs: 60000,
    maxRequests: 10,
    message: "Scan rate limit exceeded. Please wait before scanning again.",
});
exports.reportRateLimiter = new RateLimiter({
    windowMs: 300000,
    maxRequests: 5,
    message: "Report rate limit exceeded. Please wait before submitting another report.",
});
function getClientIdentifier(request) {
    const xForwardedFor = request.headers.get("x-forwarded-for");
    const xRealIP = request.headers.get("x-real-ip");
    const cfConnectingIP = request.headers.get("cf-connecting-ip");
    const ip = xForwardedFor?.split(",")[0] ||
        xRealIP ||
        cfConnectingIP ||
        "unknown";
    return ip.trim();
}
function createRateLimitResponse(resetTime) {
    const response = server_1.NextResponse.json({ error: "Rate limit exceeded", resetTime }, { status: 429 });
    response.headers.set("Retry-After", Math.ceil((resetTime - Date.now()) / 1000).toString());
    response.headers.set("X-RateLimit-Reset", resetTime.toString());
    return response;
}
function withRateLimit(limiter, handler) {
    return async (request) => {
        const identifier = getClientIdentifier(request);
        const { limited, resetTime } = limiter.isRateLimited(identifier);
        if (limited && resetTime) {
            return createRateLimitResponse(resetTime);
        }
        return handler(request);
    };
}
setInterval(() => {
    exports.apiRateLimiter.cleanup();
    exports.scanRateLimiter.cleanup();
    exports.reportRateLimiter.cleanup();
}, 600000);
//# sourceMappingURL=rate-limiter.js.map