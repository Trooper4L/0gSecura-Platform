import { type NextRequest, NextResponse } from "next/server"
import { blacklistDatabase } from "@/lib/blacklist-database"

export async function GET(request: NextRequest) {
  try {
    const stats = await blacklistDatabase.getStats()
    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Blacklist Stats API Error:", error)
    return NextResponse.json({ error: "Failed to fetch blacklist stats" }, { status: 500 })
  }
}
