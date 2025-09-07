import { NextRequest, NextResponse } from 'next/server'

// IMPORTANT: This is mock data.
// A real implementation would require an indexing service (like Covalent, Alchemy, or a custom 0G indexer)
// to query all ERC20 'Approval' events for a given user address.
const MOCK_APPROVALS = [
  {
    token: {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      name: 'USD Coin',
      symbol: 'USDC',
      logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png',
    },
    spender: {
      address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      name: 'Uniswap V2 Router',
    },
    allowance: '115792089237316195423570985008687907853269984665640564039457584007913129639935', // unlimited
  },
  {
    token: {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      name: 'Tether',
      symbol: 'USDT',
      logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
    },
    spender: {
      address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      name: 'Uniswap V2 Router',
    },
    allowance: '50000000000', // 500 USDT
  },
  {
    token: {
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      name: 'Dai',
      symbol: 'DAI',
      logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4943.png',
    },
    spender: {
      address: '0x0000000000000000000000000000000000000000',
      name: 'Unknown Spender (Potentially Risky)',
    },
    allowance: '100000000000000000000', // 100 DAI
  },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')

  if (!address) {
    return NextResponse.json({ success: false, error: 'Address is required' }, { status: 400 })
  }

  // In a real app, you would use the 'address' to query your indexer.
  // For now, we return the same mock data regardless of the address.
  return NextResponse.json({ success: true, approvals: MOCK_APPROVALS })
}