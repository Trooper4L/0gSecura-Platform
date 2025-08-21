import { type NextRequest, NextResponse } from "next/server"
import { alertSystem } from "@/lib/alert-system"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const alert = await alertSystem.getAlertById(id)

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 })
    }

    return NextResponse.json({ alert })
  } catch (error) {
    console.error("Get Alert API Error:", error)
    return NextResponse.json({ error: "Failed to fetch alert" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { action, ...data } = await request.json()

    if (action === "vote") {
      const success = await alertSystem.voteOnAlert(id, data.vote)
      if (!success) {
        return NextResponse.json({ error: "Alert not found" }, { status: 404 })
      }
      return NextResponse.json({ success: true })
    }

    if (action === "update-status") {
      const success = await alertSystem.updateAlertStatus(id, data.status)
      if (!success) {
        return NextResponse.json({ error: "Alert not found" }, { status: 404 })
      }
      return NextResponse.json({ success: true })
    }

    if (action === "add-evidence") {
      const success = await alertSystem.addEvidence(id, data.evidence)
      if (!success) {
        return NextResponse.json({ error: "Alert not found" }, { status: 404 })
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Update Alert API Error:", error)
    return NextResponse.json({ error: "Failed to update alert" }, { status: 500 })
  }
}
