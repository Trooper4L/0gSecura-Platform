/**
 * Off-Chain Wallet Authentication
 * No smart contract needed - signature verification happens on backend
 */

import { ethers } from 'ethers'

export interface OffChainAuthMessage {
  domain: string
  address: string
  statement: string
  uri: string
  version: string
  chainId: number
  nonce: string
  issuedAt: string
  expirationTime?: string
}

export class OffChainWalletAuth {
  private provider: ethers.BrowserProvider | null = null
  private signer: ethers.JsonRpcSigner | null = null

  constructor() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum)
    }
  }

  /**
   * Connect to user's wallet
   */
  async connectWallet(): Promise<string> {
    if (!this.provider) {
      throw new Error('No Web3 provider available')
    }

    await window.ethereum.request({ method: 'eth_requestAccounts' })
    this.signer = await this.provider.getSigner()
    return await this.signer.getAddress()
  }

  /**
   * Generate a standardized message for signing (similar to Sign-In with Ethereum)
   */
  createAuthMessage(address: string, nonce: string): string {
    const message: OffChainAuthMessage = {
      domain: window.location.host,
      address: address,
      statement: 'Sign in to 0gSecura Platform',
      uri: window.location.origin,
      version: '1',
      chainId: 16600, // 0G Mainnet
      nonce: nonce,
      issuedAt: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    }

    return this.formatMessage(message)
  }

  /**
   * Format message in human-readable format
   */
  private formatMessage(msg: OffChainAuthMessage): string {
    return `${msg.domain} wants you to sign in with your Ethereum account:
${msg.address}

${msg.statement}

URI: ${msg.uri}
Version: ${msg.version}
Chain ID: ${msg.chainId}
Nonce: ${msg.nonce}
Issued At: ${msg.issuedAt}${msg.expirationTime ? `\nExpiration Time: ${msg.expirationTime}` : ''}`
  }

  /**
   * Sign authentication message
   */
  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected')
    }

    return await this.signer.signMessage(message)
  }

  /**
   * Complete authentication flow
   */
  async authenticate(): Promise<{
    address: string
    message: string
    signature: string
    nonce: string
  }> {
    if (!this.signer) {
      throw new Error('Wallet not connected')
    }

    const address = await this.signer.getAddress()
    
    // Generate random nonce
    const nonce = ethers.hexlify(ethers.randomBytes(32))
    
    // Create message
    const message = this.createAuthMessage(address, nonce)
    
    // Sign message
    const signature = await this.signMessage(message)

    return {
      address,
      message,
      signature,
      nonce
    }
  }

  /**
   * Switch to 0G network
   */
  async switchToOGNetwork(networkConfig: {
    chainId: string
    chainName: string
    rpcUrls: string[]
    nativeCurrency: { name: string; symbol: string; decimals: number }
    blockExplorerUrls: string[]
  }): Promise<void> {
    if (!window.ethereum) {
      throw new Error('No Web3 provider available')
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkConfig.chainId }],
      })
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [networkConfig],
        })
      } else {
        throw switchError
      }
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(address: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not available')
    }

    const balance = await this.provider.getBalance(address)
    return ethers.formatEther(balance)
  }
}

// Export singleton instance
export const offChainAuth = new OffChainWalletAuth()

// Type declarations
declare global {
  interface Window {
    ethereum?: any
  }
}
