import { type NextRequest, NextResponse } from "next/server"
import { alertSystem } from "@/lib/alert-system"

export async function GET(request: NextRequest) {
  try {
    const stats = await alertSystem.getAlertStats()
    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Alert Stats API Error:", error)
    return NextResponse.json({ error: "Failed to fetch alert stats" }, { status: 500 })
  }
}
