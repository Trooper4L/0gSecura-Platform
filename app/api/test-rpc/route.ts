import { NextResponse } from 'next/server'
import { ethers } from 'ethers'

export async function GET() {
  try {
    // Test what the 0G RPC actually returns
    const rpcUrl = 'https://evmrpc-testnet.0g.ai'
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    
    // Get network info from RPC
    const network = await provider.getNetwork()
    const chainId = network.chainId
    const chainIdHex = '0x' + chainId.toString(16)
    
    // Test RPC call directly
    const rpcResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
        id: 1
      })
    })
    
    const rpcData = await rpcResponse.json()
    
    return NextResponse.json({
      success: true,
      rpcUrl,
      ethersNetwork: {
        chainId: Number(chainId),
        chainIdHex,
        name: network.name
      },
      directRpcCall: {
        chainId: rpcData.result,
        chainIdDecimal: rpcData.result ? parseInt(rpcData.result, 16) : null
      },
      expectedChainId: 16601,
      expectedChainIdHex: '0x40E9',
      match: {
        ethersMatch: Number(chainId) === 16601,
        rpcMatch: rpcData.result === '0x40E9'
      }
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      rpcUrl: 'https://evmrpc-testnet.0g.ai'
    }, { status: 500 })
  }
}
