import { type NextRequest, NextResponse } from "next/server"
import { blacklistDatabase } from "@/lib/blacklist-database"
import { ogStorage } from "@/lib/og-storage"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const query = {
      type: searchParams.get("type") || undefined,
      category: searchParams.get("category") || undefined,
      severity: searchParams.get("severity") || undefined,
      source: searchParams.get("source") || undefined,
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
      limit: searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : undefined,
      offset: searchParams.get("offset") ? Number.parseInt(searchParams.get("offset")!) : undefined,
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
      entries: uniqueEntries.slice(query.offset || 0, (query.offset || 0) + (query.limit || 50)),
      total: uniqueEntries.length,
      hasMore: (query.offset || 0) + (query.limit || 50) < uniqueEntries.length,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Blacklist API Error:", error)
    return NextResponse.json({ error: "Failed to fetch blacklist entries" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const entryData = await request.json()

    // Validate required fields
    const requiredFields = ["type", "value", "category", "severity", "source", "description", "reportedBy"]
    for (const field of requiredFields) {
      if (!entryData[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Create entry for local database
    const entry = await blacklistDatabase.addBlacklistEntry({
      ...entryData,
      evidence: entryData.evidence || [],
      status: "pending",
      confidence: 50,
      tags: entryData.tags || [],
      relatedEntries: entryData.relatedEntries || [],
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

    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    console.error("Create Blacklist Entry API Error:", error)
    return NextResponse.json({ error: "Failed to create blacklist entry" }, { status: 500 })
  }
}
