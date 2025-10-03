import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import { walletAuth } from '@/lib/wallet-auth'

export async function POST(request: NextRequest) {
  try {
    const { address, signature, message, chainId } = await request.json()

    // Validate required fields
    if (!address || !signature || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: address, signature, message' },
        { status: 400 }
      )
    }

    // Verify signature
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature)
      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Signature verification failed' },
        { status: 401 }
      )
    }

    // Verify network (should be 0G Galileo Testnet)
    if (chainId && chainId !== 16602) {
      return NextResponse.json(
        { error: 'Please switch to 0G Galileo Testnet (Chain ID: 16602)' },
        { status: 400 }
      )
    }

    // Check if user exists in smart contract
    let userProfile = null
    try {
      userProfile = await walletAuth.getUserProfile(address)
    } catch (error) {
      console.warn('Failed to get user profile from contract:', error)
    }

    // If user not registered, register them
    if (!userProfile) {
      try {
        const txHash = await walletAuth.registerUser({ address })
        console.log(`User registered with tx: ${txHash}`)
        
        // Get updated profile
        userProfile = await walletAuth.getUserProfile(address)
      } catch (error) {
        console.warn('Failed to register user on contract:', error)
        // Continue with basic profile
        userProfile = {
          isRegistered: false,
          registrationTimestamp: Date.now(),
          lastLoginTimestamp: Date.now(),
          totalScansPerformed: 0,
          threatsReported: 0,
          reputationScore: 100,
          isPremiumUser: false,
          profileHash: ''
        }
      }
    }

    // Authenticate user on smart contract
    try {
      const authTxHash = await walletAuth.authenticateUser()
      console.log(`User authenticated with tx: ${authTxHash}`)
    } catch (error) {
      console.warn('Smart contract authentication failed:', error)
    }

    // Create session token (JWT)
    const sessionData = {
      address: address.toLowerCase(),
      chainId: chainId || 16601,
      timestamp: Date.now(),
      userProfile
    }

    // In a real app, you'd use a proper JWT library with secret
    const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64')

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        address: address.toLowerCase(),
        isRegistered: userProfile?.isRegistered || false,
        isPremium: userProfile?.isPremiumUser || false,
        reputationScore: userProfile?.reputationScore || 100,
        totalScans: userProfile?.totalScansPerformed || 0,
        threatsReported: userProfile?.threatsReported || 0
      },
      sessionToken
    })

    response.cookies.set('auth-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Sign-in error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
