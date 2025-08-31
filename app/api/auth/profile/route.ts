import { NextRequest, NextResponse } from 'next/server'
import { walletAuth } from '@/lib/wallet-auth'

export async function GET(request: NextRequest) {
  try {
    // Get session from cookie
    const sessionCookie = request.cookies.get('auth-session')
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Decode session
    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString())
    const { address, timestamp } = sessionData

    // Check if session is expired (24 hours)
    if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      )
    }

    // Get updated user profile from smart contract
    let userProfile = null
    try {
      userProfile = await walletAuth.getUserProfile(address)
      
      // Verify session is still valid on smart contract
      const isValidSession = await walletAuth.isValidSession(address)
      if (!isValidSession) {
        return NextResponse.json(
          { error: 'Session expired on smart contract' },
          { status: 401 }
        )
      }
    } catch (error) {
      console.warn('Failed to get user profile from contract:', error)
      return NextResponse.json(
        { error: 'Failed to verify user profile' },
        { status: 500 }
      )
    }

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: {
        address: address.toLowerCase(),
        isRegistered: userProfile.isRegistered,
        isPremium: userProfile.isPremiumUser,
        reputationScore: userProfile.reputationScore,
        totalScans: userProfile.totalScansPerformed,
        threatsReported: userProfile.threatsReported,
        registrationDate: new Date(userProfile.registrationTimestamp * 1000).toISOString(),
        lastLogin: new Date(userProfile.lastLoginTimestamp * 1000).toISOString()
      }
    })

  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json(
      { error: 'Failed to get user profile' },
      { status: 500 }
    )
  }
}
