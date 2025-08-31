import { NextRequest, NextResponse } from 'next/server'
import { walletAuth } from '@/lib/wallet-auth'

export async function POST(request: NextRequest) {
  try {
    // Get session from cookie
    const sessionCookie = request.cookies.get('auth-session')
    if (!sessionCookie) {
      return NextResponse.json({ success: true }) // Already signed out
    }

    try {
      // Decode session to get user address
      const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString())
      const { address } = sessionData

      // Try to logout from smart contract
      if (address) {
        try {
          await walletAuth.logout()
          console.log(`User ${address} logged out from smart contract`)
        } catch (error) {
          console.warn('Smart contract logout failed:', error)
        }
      }
    } catch (error) {
      console.warn('Failed to decode session for logout:', error)
    }

    // Clear session cookie
    const response = NextResponse.json({ success: true })
    response.cookies.set('auth-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Sign-out error:', error)
    return NextResponse.json(
      { error: 'Sign-out failed' },
      { status: 500 }
    )
  }
}
