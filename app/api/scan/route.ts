import { type NextRequest, NextResponse } from "next/server"
import { ogBlockchain } from "@/lib/og-blockchain"
import { phishingDetector } from "@/lib/phishing-detector"
import { blacklistDatabase } from "@/lib/blacklist-database"
import { ogCompute } from "@/lib/og-compute"
import { ogStorage } from "@/lib/og-storage"
import { withRateLimit, scanRateLimiter } from "@/lib/rate-limiter"
import { validateScanRequest, ValidationError } from "@/lib/validators"

export const POST = withRateLimit(scanRateLimiter, async (request: NextRequest) => {
  try {
    const requestData = await request.json()
    const { type, address } = validateScanRequest(requestData)

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
        aiAnalysis,
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
        ogCompute.analyzeTokenSecurity({
          address,
          tokenInfo,
          contractAnalysis,
          transactionPatterns,
          liquidityAnalysis,
          holderAnalysis,
          honeypotAnalysis,
        }).catch(error => {
          console.warn("AI analysis failed:", error)
          return null
        }),
      ])

      // Combine AI analysis with traditional security score
      let trustScore = aiAnalysis 
        ? Math.floor((securityScore.overall + (100 - aiAnalysis.riskScore)) / 2)
        : securityScore.overall
        
      const flags = [
        ...securityScore.factors.positive.map((f) => `✓ ${f}`),
        ...securityScore.factors.negative.map((f) => `⚠ ${f}`),
        ...securityScore.factors.critical.map((f) => `🚨 ${f}`),
      ]

      // Add AI analysis findings
      if (aiAnalysis) {
        flags.push(`🤖 AI Confidence: ${aiAnalysis.confidence}%`)
        aiAnalysis.findings.forEach(finding => {
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
          blacklistMatches,
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

    return NextResponse.json(result)
  } catch (error) {
    console.error("Scan API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
