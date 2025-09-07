import { NextRequest, NextResponse } from 'next/server'
import { ogStorage } from '@/lib/og-storage'

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const sessionCookie = request.cookies.get('auth-session')
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Decode session to get user address
    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString())
    const { address } = sessionData

    // Check if session is expired (24 hours)
    if (Date.now() - sessionData.timestamp > 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      )
    }

    // Get scan history from 0G Storage
    const scanHistory = await ogStorage.getUserScanHistory(address)

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const scanType = searchParams.get('type') // 'token' or 'website'
    const status = searchParams.get('status') // 'safe', 'caution', 'danger'

    // Filter scans based on query parameters
    let filteredScans = scanHistory.scans

    if (scanType) {
      filteredScans = filteredScans.filter(scan => scan.scanType === scanType)
    }

    if (status) {
      filteredScans = filteredScans.filter(scan => scan.result.status === status)
    }

    // Sort by timestamp (most recent first)
    filteredScans.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Apply pagination
    const paginatedScans = filteredScans.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: {
        scans: paginatedScans,
        totalScans: filteredScans.length,
        userStats: {
          totalScans: scanHistory.totalScans,
          lastScan: scanHistory.lastScanTimestamp,
          safeScans: scanHistory.scans.filter(s => s.result.status === 'safe').length,
          dangerScans: scanHistory.scans.filter(s => s.result.status === 'danger').length,
          cautionScans: scanHistory.scans.filter(s => s.result.status === 'caution').length,
        },
        pagination: {
          limit,
          offset,
          total: filteredScans.length,
          hasMore: offset + limit < filteredScans.length
        }
      }
    })

  } catch (error) {
    console.error('Scan history API error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve scan history' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get user session
    const sessionCookie = request.cookies.get('auth-session')
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Decode session to get user address
    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString())
    const { address } = sessionData

    // Get scan ID from query params
    const { searchParams } = new URL(request.url)
    const scanId = searchParams.get('id')

    if (!scanId) {
      return NextResponse.json(
        { error: 'Scan ID required' },
        { status: 400 }
      )
    }

    // Get current scan history
    const scanHistory = await ogStorage.getUserScanHistory(address)
    
    // Remove the specific scan
    const updatedScans = scanHistory.scans.filter(scan => scan.id !== scanId)
    
    if (updatedScans.length === scanHistory.scans.length) {
      return NextResponse.json(
        { error: 'Scan not found' },
        { status: 404 }
      )
    }

    // Create the updated history object
    const updatedHistory = {
      ...scanHistory,
      scans: updatedScans,
      totalScans: scanHistory.totalScans, // Keep original total count or decrement, depends on desired logic
    }

    // Save the updated history back to 0G Storage
    await ogStorage.overwriteUserScanHistory(address, updatedHistory)

    return NextResponse.json({
      success: true,
      message: 'Scan deleted successfully',
      remainingScans: updatedScans.length,
    })

  } catch (error) {
    console.error('Delete scan history error:', error)
    return NextResponse.json(
      { error: 'Failed to delete scan' },
      { status: 500 }
    )
  }
}
