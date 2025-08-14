import { type NextRequest, NextResponse } from "next/server"
import { blacklistDatabase } from "@/lib/blacklist-database"

export async function POST(request: NextRequest) {
  try {
    const { value, type } = await request.json()

    if (!value || !type) {
      return NextResponse.json({ error: "Missing required fields: value and type" }, { status: 400 })
    }

    const matches = await blacklistDatabase.checkBlacklist(value, type)
    const isBlacklisted = matches.length > 0
    const highestSeverity = matches.length > 0 ? matches[0].severity : null

    return NextResponse.json({
      isBlacklisted,
      severity: highestSeverity,
      matches,
      count: matches.length,
    })
  } catch (error) {
    console.error("Blacklist Check API Error:", error)
    return NextResponse.json({ error: "Failed to check blacklist" }, { status: 500 })
  }
}
