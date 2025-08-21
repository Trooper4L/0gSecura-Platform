import { Router, Request, Response } from 'express'
import rateLimit from 'express-rate-limit'
import { asyncHandler, ValidationError } from '@/middleware/error-handler'
import { ogBlockchain } from '@/lib/og-blockchain'
import { phishingDetector } from '@/lib/phishing-detector'
import { blacklistDatabase } from '@/lib/blacklist-database'
import { ogCompute } from '@/lib/og-compute'
import { ogStorage } from '@/lib/og-storage'
import { validateScanRequest } from '@/lib/validators'

const router = Router()

// Specific rate limit for scanning
const scanLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 10, // 10 scans per minute
  message: {
    error: 'Scan rate limit exceeded. Please wait before scanning again.',
  },
})

router.use(scanLimiter)

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { type, address } = validateScanRequest(req.body)

  let result: any = {}

  if (type === "token") {
    const [
      tokenInfo,
      contractAnalysis,
      transactionPatterns,
      liquidityAnalysis,
      holderAnalysis,
      honeypotAnalysis,
      securityScore,
      blacklistMatches,
      storageBlacklist,
    ] = await Promise.all([
      ogBlockchain.getTokenInfo(address),
      ogBlockchain.analyzeContract(address),
      ogBlockchain.getTransactionPatterns(address),
      ogBlockchain.analyzeLiquidity(address),
      ogBlockchain.analyzeHolders(address),
      ogBlockchain.detectHoneypot(address),
      ogBlockchain.calculateSecurityScore(address),
      blacklistDatabase.checkBlacklist(address, "address"),
      ogStorage.searchBlacklist({ value: address, type: "address" }),
    ])

    // Run AI analysis with collected data
    let finalAiAnalysis = null
    try {
      finalAiAnalysis = await ogCompute.analyzeTokenSecurity({
        address,
        tokenInfo,
        contractAnalysis,
        transactionPatterns,
        liquidityAnalysis,
        holderAnalysis,
        honeypotAnalysis,
      })
    } catch (error) {
      console.warn("AI analysis failed:", error)
    }

    // Combine AI analysis with traditional security score
    let trustScore = finalAiAnalysis 
      ? Math.floor((securityScore.overall + (100 - finalAiAnalysis.riskScore)) / 2)
      : securityScore.overall
      
    const flags = [
      ...securityScore.factors.positive.map((f) => `✓ ${f}`),
      ...securityScore.factors.negative.map((f) => `⚠ ${f}`),
      ...securityScore.factors.critical.map((f) => `🚨 ${f}`),
    ]

    // Add AI analysis findings
    if (finalAiAnalysis) {
      flags.push(`🤖 AI Confidence: ${finalAiAnalysis.confidence}%`)
      finalAiAnalysis.findings.forEach(finding => {
        flags.push(`🔍 ${finding}`)
      })
    }

    // Check all blacklist sources
    const allBlacklistMatches = [...blacklistMatches, ...storageBlacklist]
    if (allBlacklistMatches.length > 0) {
      trustScore = Math.min(trustScore, 20) // Severely reduce trust score
      allBlacklistMatches.forEach((match) => {
        flags.unshift(`🚨 Blacklisted: ${match.description}`)
      })
    }

    const status = trustScore >= 70 ? "safe" : trustScore >= 40 ? "caution" : "danger"

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
    }
  } else if (type === "website") {
    const [phishingAnalysis, blacklistMatches] = await Promise.all([
      phishingDetector.analyzeWebsite(address),
      blacklistDatabase.checkBlacklist(address, "url"),
    ])

    let trustScore = phishingAnalysis.trustScore
    const flags = [...phishingAnalysis.flags]

    // Apply blacklist penalties
    if (blacklistMatches.length > 0) {
      trustScore = Math.min(trustScore, 10)
      blacklistMatches.forEach((match) => {
        flags.unshift(`🚨 Blacklisted: ${match.description}`)
      })
    }

    const status = trustScore >= 70 ? "safe" : trustScore >= 40 ? "caution" : "danger"

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
    }
  }

  // Store scan result in 0G Storage for analytics
  try {
    await ogStorage.storeSecurityReport({
      id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: "scan_result",
      data: result,
      metadata: {
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        scanType: type,
        ip: req.ip,
      },
    })
  } catch (error) {
    console.warn("Failed to store scan result:", error)
  }

  res.json(result)
}))

export default router
