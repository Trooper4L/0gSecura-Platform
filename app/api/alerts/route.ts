import { type NextRequest, NextResponse } from "next/server"
import { alertSystem } from "@/lib/alert-system"
import { ogStorage } from "@/lib/og-storage"
import { ogCompute } from "@/lib/og-compute"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const severity = searchParams.get("severity")
    const status = searchParams.get("status")
    const limit = searchParams.get("limit")

    const filters = {
      ...(type && { type }),
      ...(severity && { severity }),
      ...(status && { status }),
      ...(limit && { limit: Number.parseInt(limit) }),
    }

    const alerts = await alertSystem.getAllAlerts(filters)
    return NextResponse.json({ alerts })
  } catch (error) {
    console.error("Alerts API Error:", error)
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const alertData = await request.json()

    // Validate required fields
    const requiredFields = ["type", "severity", "title", "description", "affectedAddress", "reportedBy"]
    for (const field of requiredFields) {
      if (!alertData[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Use 0G Compute for AI-powered threat analysis
    let aiAnalysis = null
    try {
      aiAnalysis = await ogCompute.analyzeTokenSecurity({
        address: alertData.affectedAddress,
        type: alertData.type,
        description: alertData.description,
      })
    } catch (error) {
      console.warn("AI analysis failed:", error)
    }

    const alert = await alertSystem.createAlert({
      ...alertData,
      status: "active",
      affectedUsers: 0,
      evidence: aiAnalysis ? [{
        type: "ai_analysis",
        data: aiAnalysis,
        timestamp: new Date().toISOString(),
        description: `AI analysis: ${aiAnalysis.confidence}% confidence, risk score ${aiAnalysis.riskScore}`,
      }] : [],
      tags: alertData.tags || [],
      verificationStatus: aiAnalysis && aiAnalysis.confidence > 90 ? "community-verified" : "unverified",
    })

    // Store threat intelligence in 0G Storage
    try {
      await ogStorage.uploadThreatIntelligence([{
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
      }])
    } catch (error) {
      console.warn("Failed to store threat intelligence:", error)
    }

    return NextResponse.json({ alert }, { status: 201 })
  } catch (error) {
    console.error("Create Alert API Error:", error)
    return NextResponse.json({ error: "Failed to create alert" }, { status: 500 })
  }
}
