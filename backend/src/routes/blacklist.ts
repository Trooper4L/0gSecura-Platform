import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { asyncHandler } from '@/middleware/error-handler'
import { blacklistDatabase } from '@/lib/blacklist-database'
import { ogStorage } from '@/lib/og-storage'
import { validateBlacklistEntry, validatePaginationParams } from '@/lib/validators'

const router = Router()

// Rate limiting for blacklist operations
const reportLimiter = rateLimit({
  windowMs: 300000, // 5 minutes
  max: 5, // 5 reports per 5 minutes
  message: {
    error: 'Report rate limit exceeded. Please wait before submitting another report.',
  },
})

// GET /api/blacklist - Retrieve blacklist entries
router.get('/', asyncHandler(async (req, res) => {
  const { limit, offset } = validatePaginationParams(req.query as any)
  
  const query = {
    type: req.query.type as string || undefined,
    category: req.query.category as string || undefined,
    severity: req.query.severity as string || undefined,
    source: req.query.source as string || undefined,
    status: req.query.status as string || undefined,
    search: req.query.search as string || undefined,
    limit,
    offset,
  }

  // Get data from both local database and 0G Storage
  const [localResult, storageData] = await Promise.all([
    blacklistDatabase.getAllEntries(query),
    ogStorage.searchBlacklist({
      type: query.type,
      category: query.category,
      severity: query.severity,
      value: query.search,
    })
  ])

  // Merge results and deduplicate
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
  ]

  // Remove duplicates based on value
  const uniqueEntries = allEntries.filter((entry, index, self) => 
    index === self.findIndex(e => e.value === entry.value)
  )

  const result = {
    entries: uniqueEntries.slice(offset, offset + limit),
    total: uniqueEntries.length,
    hasMore: offset + limit < uniqueEntries.length,
  }

  res.json(result)
}))

// POST /api/blacklist - Add new blacklist entry
router.post('/', reportLimiter, asyncHandler(async (req, res) => {
  const validatedData = validateBlacklistEntry(req.body)

  // Create entry for local database
  const entry = await blacklistDatabase.addBlacklistEntry({
    ...validatedData,
    reportedBy: req.body.reportedBy || 'Anonymous',
    evidence: req.body.evidence || [],
    status: "pending",
    confidence: 50,
    tags: req.body.tags || [],
    relatedEntries: req.body.relatedEntries || [],
  })

  // Also store in 0G Storage for distributed access
  try {
    await ogStorage.uploadBlacklistData([{
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
    }])
  } catch (storageError) {
    console.warn("Failed to store in 0G Storage:", storageError)
    // Continue anyway - local storage succeeded
  }

  res.status(201).json({ entry })
}))

// GET /api/blacklist/stats - Get blacklist statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await blacklistDatabase.getStats()
  res.json({ stats })
}))

// GET /api/blacklist/check - Check if address/URL is blacklisted
router.get('/check', asyncHandler(async (req, res) => {
  const { value, type } = req.query as { value?: string; type?: string }
  
  if (!value || !type) {
    return res.status(400).json({ 
      error: 'Missing required parameters: value and type',
      required: ['value', 'type']
    })
  }

  const [localMatches, storageMatches] = await Promise.all([
    blacklistDatabase.checkBlacklist(value, type),
    ogStorage.searchBlacklist({ value, type })
  ])

  const allMatches = [...localMatches, ...storageMatches]
  const isBlacklisted = allMatches.length > 0

  res.json({
    blacklisted: isBlacklisted,
    matches: allMatches,
    riskLevel: isBlacklisted 
      ? Math.max(...allMatches.map(m => m.severity === 'critical' ? 100 : m.severity === 'high' ? 75 : 50))
      : 0
  })
}))

export default router
