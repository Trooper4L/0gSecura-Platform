// Test 0G Network Connectivity
const { ethers } = require('ethers')

async function test0GNetwork() {
  console.log('🧪 Testing 0G Network Connectivity...')
  console.log('=====================================')

  try {
    // Test RPC connection
    const rpcUrl = process.env.OG_CHAIN_RPC_URL || 'https://evmrpc-testnet.0g.ai'
    console.log('📡 Connecting to RPC:', rpcUrl)
    
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    
    // Get network info
    const network = await provider.getNetwork()
    console.log('🌐 Network Name:', network.name)
    console.log('🔗 Chain ID:', network.chainId.toString())
    
    // Get latest block
    const blockNumber = await provider.getBlockNumber()
    console.log('📦 Latest Block:', blockNumber)
    
    // Test wallet if private key provided
    const privateKey = process.env.OG_PRIVATE_KEY
    if (privateKey) {
      console.log('\n💰 Testing Wallet...')
      const wallet = new ethers.Wallet(privateKey, provider)
      console.log('📍 Wallet Address:', wallet.address)
      
      const balance = await provider.getBalance(wallet.address)
      const balanceInOG = ethers.formatEther(balance)
      console.log('💵 Balance:', balanceInOG, 'OG')
      
      if (parseFloat(balanceInOG) === 0) {
        console.log('⚠️  No tokens! Get some from https://faucet.0g.ai')
      } else {
        console.log('✅ Wallet has tokens - ready for storage operations')
      }
    } else {
      console.log('⚠️  No private key configured - storage uploads will be disabled')
    }

    // Test indexer if configured
    const indexerRpc = process.env.OG_INDEXER_RPC || 'https://indexer-storage-testnet-turbo.0g.ai'
    console.log('\n🗂️  Testing Storage Indexer...')
    console.log('📡 Indexer RPC:', indexerRpc)
    
    try {
      const response = await fetch(indexerRpc)
      if (response.ok) {
        console.log('✅ Storage indexer is accessible')
      } else {
        console.log('⚠️  Storage indexer returned:', response.status)
      }
    } catch (error) {
      console.log('❌ Storage indexer not accessible:', error.message)
    }

    console.log('\n✅ 0G Network test completed successfully!')
    console.log('=====================================')
    
  } catch (error) {
    console.error('❌ 0G Network test failed:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('1. Check your internet connection')
    console.log('2. Verify RPC URL in .env.local')
    console.log('3. Ensure 0G testnet is operational')
    process.exit(1)
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' })

test0GNetwork()
