import { Router, Request, Response } from 'express'
import { asyncHandler } from '@/middleware/error-handler'
import { ogBlockchain } from '@/lib/og-blockchain'

const router = Router()

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Check 0G blockchain connectivity
    const startTime = Date.now()
    const blockNumber = await ogBlockchain.getBlockNumber()
    const responseTime = Date.now() - startTime

    // Basic health metrics
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
    }

    res.json(health)
  } catch (error) {
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
    }

    res.status(503).json(unhealthyResponse)
  }
}))

export default router
