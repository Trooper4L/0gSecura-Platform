import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { asyncHandler } from '@/middleware/error-handler'
import { alertSystem } from '@/lib/alert-system'
import { ogStorage } from '@/lib/og-storage'
import { ogCompute } from '@/lib/og-compute'
import { validateAlertData } from '@/lib/validators'

const router = Router()

// Rate limiting for alert operations
const reportLimiter = rateLimit({
  windowMs: 300000, // 5 minutes
  max: 5, // 5 reports per 5 minutes
  message: {
    error: 'Alert rate limit exceeded. Please wait before submitting another alert.',
  },
})

// GET /api/alerts - Get security alerts
router.get('/', asyncHandler(async (req, res) => {
  const type = req.query.type as string
  const severity = req.query.severity as string
  const status = req.query.status as string
  const limit = req.query.limit as string

  const filters = {
    ...(type && { type }),
    ...(severity && { severity }),
    ...(status && { status }),
    ...(limit && { limit: parseInt(limit) }),
  }

  const alerts = await alertSystem.getAllAlerts(filters)
  res.json({ alerts })
}))

// POST /api/alerts - Create new security alert
router.post('/', reportLimiter, asyncHandler(async (req, res) => {
  const validatedData = validateAlertData(req.body)

  // Use 0G Compute for AI-powered threat analysis
  let aiAnalysis = null
  try {
    aiAnalysis = await ogCompute.analyzeTokenSecurity({
      address: validatedData.affectedAddress,
      type: validatedData.type,
      description: validatedData.description,
    })
  } catch (error) {
    console.warn("AI analysis failed:", error)
  }

  const alert = await alertSystem.createAlert({
    ...validatedData,
    status: "active",
    affectedUsers: 0,
    evidence: aiAnalysis ? [{
      type: "ai_analysis",
      data: aiAnalysis,
      timestamp: new Date().toISOString(),
      description: `AI analysis: ${aiAnalysis.confidence}% confidence, risk score ${aiAnalysis.riskScore}`,
    }] : [],
    tags: validatedData.tags || [],
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

  res.status(201).json({ alert })
}))

// GET /api/alerts/stats - Get alert statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await alertSystem.getAlertStats()
  res.json({ stats })
}))

// GET /api/alerts/:id - Get specific alert
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params
  const alert = await alertSystem.getAlertById(id)

  if (!alert) {
    return res.status(404).json({ error: "Alert not found" })
  }

  res.json({ alert })
}))

// PATCH /api/alerts/:id - Update alert (vote, status, evidence)
router.patch('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params
  const { action, ...data } = req.body

  if (action === "vote") {
    const success = await alertSystem.voteOnAlert(id, data.vote)
    if (!success) {
      return res.status(404).json({ error: "Alert not found" })
    }
    return res.json({ success: true })
  }

  if (action === "update-status") {
    const success = await alertSystem.updateAlertStatus(id, data.status)
    if (!success) {
      return res.status(404).json({ error: "Alert not found" })
    }
    return res.json({ success: true })
  }

  if (action === "add-evidence") {
    const success = await alertSystem.addEvidence(id, data.evidence)
    if (!success) {
      return res.status(404).json({ error: "Alert not found" })
    }
    return res.json({ success: true })
  }

  res.status(400).json({ error: "Invalid action" })
}))

export default router
