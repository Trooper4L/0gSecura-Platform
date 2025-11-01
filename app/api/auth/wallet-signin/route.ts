/**
 * Off-Chain Wallet Authentication API
 * Verifies wallet signatures without smart contract
 */

import { NextResponse } from 'next/server'
import { ethers } from 'ethers'

// In production, use a proper database and session store
// This is a simplified example
const sessions = new Map<string, {
  address: string
  nonce: string
  expiresAt: number
}>()

const usedNonces = new Set<string>()

/**
 * Generate a nonce for wallet authentication
 */
export async function GET(request: Request) {
  try {
    // Generate random nonce
    const nonce = ethers.hexlify(ethers.randomBytes(32))
    
    return NextResponse.json({ 
      nonce,
      expiresIn: 300 // 5 minutes to use this nonce
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to generate nonce', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Verify signature and create session
 */
export async function POST(request: Request) {
  try {
    const { address, message, signature, nonce } = await request.json()

    // Validate inputs
    if (!address || !message || !signature || !nonce) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if nonce was already used (prevent replay attacks)
    if (usedNonces.has(nonce)) {
      return NextResponse.json(
        { error: 'Nonce already used' },
        { status: 400 }
      )
    }

    // Verify the signature
    const recoveredAddress = ethers.verifyMessage(message, signature)

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Verify message contains expected data
    if (!message.includes(address) || !message.includes(nonce)) {
      return NextResponse.json(
        { error: 'Invalid message format' },
        { status: 400 }
      )
    }

    // Mark nonce as used
    usedNonces.add(nonce)

    // Create session (24 hour expiry)
    const sessionId = ethers.hexlify(ethers.randomBytes(32))
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

    sessions.set(sessionId, {
      address: address.toLowerCase(),
      nonce,
      expiresAt
    })

    // In production, store in database and use secure HTTP-only cookies
    return NextResponse.json({
      success: true,
      sessionId,
      address,
      expiresAt: new Date(expiresAt).toISOString(),
      message: 'Authentication successful'
    })

  } catch (error: any) {
    console.error('Authentication error:', error)
    return NextResponse.json(
      { error: 'Authentication failed', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Verify existing session
 */
export async function PUT(request: Request) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }

    const session = sessions.get(sessionId)

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Check if session expired
    if (Date.now() > session.expiresAt) {
      sessions.delete(sessionId)
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      valid: true,
      address: session.address,
      expiresAt: new Date(session.expiresAt).toISOString()
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Session verification failed', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Logout - invalidate session
 */
export async function DELETE(request: Request) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }

    sessions.delete(sessionId)

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Logout failed', details: error.message },
      { status: 500 }
    )
  }
}
