// Rate limiting for API endpoints
import { NextRequest, NextResponse } from "next/server"

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  message?: string
}

class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      message: config.message || "Too many requests, please try again later",
    }
  }

  isRateLimited(identifier: string): { limited: boolean; resetTime?: number } {
    const now = Date.now()
    const record = this.requests.get(identifier)

    if (!record || now > record.resetTime) {
      // First request or window expired
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs,
      })
      return { limited: false }
    }

    if (record.count >= this.config.maxRequests) {
      return { limited: true, resetTime: record.resetTime }
    }

    // Increment count
    record.count++
    this.requests.set(identifier, record)
    
    return { limited: false }
  }

  cleanup() {
    const now = Date.now()
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key)
      }
    }
  }
}

// Default rate limiters
export const apiRateLimiter = new RateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || "900000"), // 15 minutes
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX || "100"),
  message: "API rate limit exceeded. Please try again in a few minutes.",
})

export const scanRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 10, // 10 scans per minute
  message: "Scan rate limit exceeded. Please wait before scanning again.",
})

export const reportRateLimiter = new RateLimiter({
  windowMs: 300000, // 5 minutes
  maxRequests: 5, // 5 reports per 5 minutes
  message: "Report rate limit exceeded. Please wait before submitting another report.",
})

export function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from various headers (for different deployment scenarios)
  const xForwardedFor = request.headers.get("x-forwarded-for")
  const xRealIP = request.headers.get("x-real-ip")
  const cfConnectingIP = request.headers.get("cf-connecting-ip")
  
  // Use the first available identifier
  const ip = xForwardedFor?.split(",")[0] || 
           xRealIP || 
           cfConnectingIP || 
           "unknown"
  
  return ip.trim()
}

export function createRateLimitResponse(resetTime: number): NextResponse {
  const response = NextResponse.json(
    { error: "Rate limit exceeded", resetTime },
    { status: 429 }
  )
  
  response.headers.set("Retry-After", Math.ceil((resetTime - Date.now()) / 1000).toString())
  response.headers.set("X-RateLimit-Reset", resetTime.toString())
  
  return response
}

export function withRateLimit(
  limiter: RateLimiter,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const identifier = getClientIdentifier(request)
    const { limited, resetTime } = limiter.isRateLimited(identifier)
    
    if (limited && resetTime) {
      return createRateLimitResponse(resetTime)
    }
    
    return handler(request)
  }
}

// Cleanup expired entries every 10 minutes
setInterval(() => {
  apiRateLimiter.cleanup()
  scanRateLimiter.cleanup()
  reportRateLimiter.cleanup()
}, 600000)
