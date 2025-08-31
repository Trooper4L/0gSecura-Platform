import { type NextRequest, NextResponse } from "next/server"
import { ogBlockchain } from "@/lib/og-blockchain"
import { phishingDetector } from "@/lib/phishing-detector"
import { blacklistDatabase } from "@/lib/blacklist-database"
import { ogCompute } from "@/lib/og-compute"
import { geminiAnalyzer } from "@/lib/gemini-ai"
import { ogStorage } from "@/lib/og-storage"
import { withRateLimit, scanRateLimiter } from "@/lib/rate-limiter"
import { validateScanRequest, ValidationError } from "@/lib/validators"

async function storeScanToHistory(
  request: NextRequest, 
  result: any, 
  aiAnalysis: any, 
  scanType: string, 
  targetAddress: string
) {
  try {
    // Get user address from session (if authenticated)
    const sessionCookie = request.cookies.get('auth-session')
    let userId = 'anonymous'
    
    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString())
        userId = sessionData.address
      } catch (error) {
        console.warn('Failed to decode session for scan history:', error)
      }
    }

    // Create scan history entry
    const scanEntry = {
      id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      scanType: scanType as "token" | "website",
      targetAddress,
      result: {
        trustScore: result.trustScore,
        status: result.status,
        flags: result.flags,
        aiAnalysis: aiAnalysis ? {
          riskScore: aiAnalysis.riskScore,
          confidence: aiAnalysis.confidence,
          findings: aiAnalysis.findings,
          summary: aiAnalysis.summary
        } : undefined
      },
      timestamp: new Date().toISOString(),
      chainId: 16601,
      sessionId: sessionCookie?.value
    }

    // Store in 0G Storage
    await ogStorage.storeScanHistory(userId, scanEntry)
    
    console.log(`✅ Scan history stored for user: ${userId.slice(0, 8)}`)
    
  } catch (error) {
    console.warn("Failed to store scan history:", error)
  }
}

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
        // AI analysis will be done after we have all the data
        Promise.resolve(null),
      ])

      // Run AI analysis with Gemini
      let finalAiAnalysis = null
      try {
        // Try Gemini AI first for enhanced analysis
        if (geminiAnalyzer.isAvailable()) {
          finalAiAnalysis = await geminiAnalyzer.analyzeSmartContract({
            address,
            tokenInfo,
            contractAnalysis,
            transactionPatterns,
            liquidityAnalysis,
            holderAnalysis,
            honeypotAnalysis,
          })
        } else {
          // Fallback to 0G Compute
          finalAiAnalysis = await ogCompute.analyzeTokenSecurity({
            address,
            tokenInfo,
            contractAnalysis,
            transactionPatterns,
            liquidityAnalysis,
            holderAnalysis,
            honeypotAnalysis,
          })
        }
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
          blacklistMatches,
        },
      }

      // Store token scan in 0G Storage
      await storeScanToHistory(request, result, finalAiAnalysis, type, address)
    } else if (type === "website") {
      const [phishingAnalysis, blacklistMatches] = await Promise.all([
        phishingDetector.analyzeWebsite(address),
        blacklistDatabase.checkBlacklist(address, "url"),
      ])

      let trustScore = phishingAnalysis.trustScore
      const flags = [...phishingAnalysis.flags]

      // Enhanced AI analysis with Gemini
      try {
        if (geminiAnalyzer.isAvailable()) {
          const geminiAnalysis = await geminiAnalyzer.analyzeWebsite({
            url: address,
            domainInfo: phishingAnalysis.details.domainAnalysis,
            sslAnalysis: phishingAnalysis.details.sslAnalysis,
            contentAnalysis: phishingAnalysis.details.contentAnalysis,
            phishingChecks: phishingAnalysis.details.reputationAnalysis,
          })

          // Combine traditional analysis with Gemini insights
          trustScore = Math.floor((trustScore + (100 - geminiAnalysis.riskScore)) / 2)
          
          // Add Gemini findings to flags
          flags.push(`🤖 AI Confidence: ${geminiAnalysis.confidence}%`)
          geminiAnalysis.findings.forEach(finding => {
            flags.push(`🔍 ${finding}`)
          })
        }
      } catch (error) {
        console.warn("Gemini website analysis failed:", error)
      }

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

      // Store website scan in 0G Storage
      await storeScanToHistory(request, result, null, type, address)
    }



    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ 
        error: error.message,
        field: error.field 
      }, { status: 400 })
    }
    
    console.error("Scan API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})
