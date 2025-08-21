import { NextRequest, NextResponse } from "next/server";
interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    message?: string;
}
declare class RateLimiter {
    private requests;
    private config;
    constructor(config: RateLimitConfig);
    isRateLimited(identifier: string): {
        limited: boolean;
        resetTime?: number;
    };
    cleanup(): void;
}
export declare const apiRateLimiter: RateLimiter;
export declare const scanRateLimiter: RateLimiter;
export declare const reportRateLimiter: RateLimiter;
export declare function getClientIdentifier(request: NextRequest): string;
export declare function createRateLimitResponse(resetTime: number): NextResponse;
export declare function withRateLimit(limiter: RateLimiter, handler: (request: NextRequest) => Promise<NextResponse>): (request: NextRequest) => Promise<NextResponse>;
export {};
//# sourceMappingURL=rate-limiter.d.ts.map