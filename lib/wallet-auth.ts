import { ethers } from 'ethers'

// OFFICIAL 0G Galileo Testnet Configuration (from 0G docs)
export const OG_GALILEO_TESTNET = {
  chainId: '0x40E9', // 16601 in hex
  chainIdNumber: 16601,
  chainName: '0G-Galileo-Testnet',
  nativeCurrency: {
    name: 'OG',
    symbol: 'OG',
    decimals: 18,
  },
  rpcUrls: ['https://evmrpc-testnet.0g.ai'],
  blockExplorerUrls: ['https://chainscan-galileo.0g.ai'],
}

// Smart Contract Configuration
export const OGSECURA_AUTH_CONTRACT = {
  address: process.env.NEXT_PUBLIC_AUTH_CONTRACT_ADDRESS || '',
  abi: [
    // Essential functions for wallet authentication
    'function registerUser(bytes32 profileHash) external',
    'function authenticateUser(string calldata message, bytes calldata signature, bytes32 nonce) external',
    'function verifyNetworkAndUpdateStatus() external',
    'function recordScan(string calldata scanType) external',
    'function reportThreat(bytes32 threatHash) external',
    'function logout() external',
    'function isValidSession(address user) external view returns (bool)',
    'function getUserProfile(address user) external view returns (tuple(bool isRegistered, uint256 registrationTimestamp, uint256 lastLoginTimestamp, uint256 totalScansPerformed, uint256 threatsReported, uint256 reputationScore, bool isPremiumUser, bytes32 profileHash))',
    'function getContractStats() external view returns (uint256 totalUsers, uint256 totalScans, uint256 totalThreats)',
    'function getNetworkInfo() external view returns (uint256 chainId, bool isOGNetwork)',
    
    // Events
    'event UserRegistered(address indexed user, uint256 timestamp, bool isPremium)',
    'event UserAuthenticated(address indexed user, uint256 timestamp, bytes32 sessionHash)',
    'event NetworkVerified(address indexed user, uint256 chainId, uint256 timestamp)',
    'event ScanPerformed(address indexed user, string scanType, uint256 timestamp)',
    'event ThreatReported(address indexed reporter, bytes32 indexed threatHash, uint256 timestamp)'
  ]
}

export interface UserProfile {
  isRegistered: boolean
  registrationTimestamp: number
  lastLoginTimestamp: number
  totalScansPerformed: number
  threatsReported: number
  reputationScore: number
  isPremiumUser: boolean
  profileHash: string
}

export class WalletAuthService {
  private provider: ethers.BrowserProvider | null = null
  private contract: ethers.Contract | null = null
  private signer: ethers.JsonRpcSigner | null = null

  constructor() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum)
    }
  }

  /**
   * Check if MetaMask or compatible wallet is available
   */
  isWalletAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.ethereum
  }

  /**
   * Connect to user's wallet
   */
  async connectWallet(): Promise<string> {
    if (!this.provider) {
      throw new Error('No Web3 provider available')
    }

    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      
      this.signer = await this.provider.getSigner()
      const address = await this.signer.getAddress()
      
      // Initialize contract
      if (OGSECURA_AUTH_CONTRACT.address) {
        this.contract = new ethers.Contract(
          OGSECURA_AUTH_CONTRACT.address,
          OGSECURA_AUTH_CONTRACT.abi,
          this.signer
        )
      }

      return address
    } catch (error: any) {
      throw new Error(`Failed to connect wallet: ${error.message}`)
    }
  }

  /**
   * Check current network and prompt switch if necessary
   */
  async ensureCorrectNetwork(): Promise<boolean> {
    if (!this.provider) {
      throw new Error('Wallet not connected')
    }

    try {
      const network = await this.provider.getNetwork()
      const currentChainId = '0x' + network.chainId.toString(16)

      if (currentChainId === OG_GALILEO_TESTNET.chainId) {
        return true
      }

      // Attempt to switch networks
      await this.switchToOGNetwork()
      return true
    } catch (error: any) {
      throw new Error(`Network switch failed: ${error.message}`)
    }
  }

  /**
   * Switch to 0G Galileo Testnet
   */
  async switchToOGNetwork(): Promise<void> {
    if (!window.ethereum) {
      throw new Error('No Web3 provider available')
    }

    try {
      // Try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: OG_GALILEO_TESTNET.chainId }],
      })
    } catch (switchError: any) {
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [OG_GALILEO_TESTNET],
        })
      } else {
        throw switchError
      }
    }
  }

  /**
   * Register user profile on smart contract
   */
  async registerUser(profileData: any = {}): Promise<string> {
    if (!this.contract || !this.signer) {
      throw new Error('Contract not initialized')
    }

    try {
      // Create profile hash (simplified - in production use IPFS)
      const profileHash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify(profileData))
      )

      const tx = await this.contract.registerUser(profileHash)
      await tx.wait()

      return tx.hash
    } catch (error: any) {
      throw new Error(`Registration failed: ${error.message}`)
    }
  }

  /**
   * Authenticate user with signed message
   */
  async authenticateUser(): Promise<string> {
    if (!this.contract || !this.signer) {
      throw new Error('Contract not initialized')
    }

    try {
      const address = await this.signer.getAddress()
      const nonce = ethers.randomBytes(32)
      const message = `0gSecura Authentication\nAddress: ${address}\nTimestamp: ${Date.now()}\nNonce: ${ethers.hexlify(nonce)}`
      
      // Sign message
      const signature = await this.signer.signMessage(message)
      
      // Submit to contract
      const nonceBytes32 = ethers.keccak256(nonce)
      const tx = await this.contract.authenticateUser(message, signature, nonceBytes32)
      await tx.wait()

      return tx.hash
    } catch (error: any) {
      throw new Error(`Authentication failed: ${error.message}`)
    }
  }

  /**
   * Verify network and update premium status
   */
  async verifyNetworkAndUpdateStatus(): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized')
    }

    try {
      const tx = await this.contract.verifyNetworkAndUpdateStatus()
      await tx.wait()
      return tx.hash
    } catch (error: any) {
      throw new Error(`Network verification failed: ${error.message}`)
    }
  }

  /**
   * Record a security scan
   */
  async recordScan(scanType: string): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized')
    }

    try {
      const tx = await this.contract.recordScan(scanType)
      await tx.wait()
      return tx.hash
    } catch (error: any) {
      throw new Error(`Scan recording failed: ${error.message}`)
    }
  }

  /**
   * Report a threat
   */
  async reportThreat(threatData: any): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized')
    }

    try {
      // Create threat hash (simplified - in production use 0G Storage)
      const threatHash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify(threatData))
      )

      const tx = await this.contract.reportThreat(threatHash)
      await tx.wait()
      return tx.hash
    } catch (error: any) {
      throw new Error(`Threat reporting failed: ${error.message}`)
    }
  }

  /**
   * Get user profile from contract
   */
  async getUserProfile(address: string): Promise<UserProfile | null> {
    if (!this.contract) {
      throw new Error('Contract not initialized')
    }

    try {
      const profile = await this.contract.getUserProfile(address)
      
      if (!profile.isRegistered) {
        return null
      }

      return {
        isRegistered: profile.isRegistered,
        registrationTimestamp: Number(profile.registrationTimestamp),
        lastLoginTimestamp: Number(profile.lastLoginTimestamp),
        totalScansPerformed: Number(profile.totalScansPerformed),
        threatsReported: Number(profile.threatsReported),
        reputationScore: Number(profile.reputationScore),
        isPremiumUser: profile.isPremiumUser,
        profileHash: profile.profileHash
      }
    } catch (error: any) {
      throw new Error(`Failed to get user profile: ${error.message}`)
    }
  }

  /**
   * Check if user has valid session
   */
  async isValidSession(address: string): Promise<boolean> {
    if (!this.contract) {
      return false
    }

    try {
      return await this.contract.isValidSession(address)
    } catch (error) {
      return false
    }
  }

  /**
   * Get contract statistics
   */
  async getContractStats(): Promise<{
    totalUsers: number
    totalScans: number
    totalThreats: number
  }> {
    if (!this.contract) {
      throw new Error('Contract not initialized')
    }

    try {
      const stats = await this.contract.getContractStats()
      return {
        totalUsers: Number(stats.totalUsers),
        totalScans: Number(stats.totalScans),
        totalThreats: Number(stats.totalThreats)
      }
    } catch (error: any) {
      throw new Error(`Failed to get contract stats: ${error.message}`)
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized')
    }

    try {
      const tx = await this.contract.logout()
      await tx.wait()
      return tx.hash
    } catch (error: any) {
      throw new Error(`Logout failed: ${error.message}`)
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(address: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not available')
    }

    try {
      const balance = await this.provider.getBalance(address)
      return ethers.formatEther(balance)
    } catch (error: any) {
      throw new Error(`Failed to get balance: ${error.message}`)
    }
  }

  /**
   * Listen for contract events
   */
  setupEventListeners(callbacks: {
    onUserRegistered?: (user: string, timestamp: number, isPremium: boolean) => void
    onUserAuthenticated?: (user: string, timestamp: number, sessionHash: string) => void
    onScanPerformed?: (user: string, scanType: string, timestamp: number) => void
    onThreatReported?: (reporter: string, threatHash: string, timestamp: number) => void
  }) {
    if (!this.contract) {
      console.warn('Contract not initialized for event listening')
      return
    }

    if (callbacks.onUserRegistered) {
      this.contract.on('UserRegistered', callbacks.onUserRegistered)
    }

    if (callbacks.onUserAuthenticated) {
      this.contract.on('UserAuthenticated', callbacks.onUserAuthenticated)
    }

    if (callbacks.onScanPerformed) {
      this.contract.on('ScanPerformed', callbacks.onScanPerformed)
    }

    if (callbacks.onThreatReported) {
      this.contract.on('ThreatReported', callbacks.onThreatReported)
    }
  }
}

// Global wallet auth service instance
export const walletAuth = new WalletAuthService()

// Type declarations
declare global {
  interface Window {
    ethereum?: any
  }
}
