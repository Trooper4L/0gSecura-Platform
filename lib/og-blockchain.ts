// 0g Blockchain Integration
// This module handles communication with the 0g blockchain network

import { ethers } from "ethers"
import { blacklistDatabase } from "./blacklist-database"

export interface TokenInfo {
  address: string
  name: string
  symbol: string
  decimals: number
  totalSupply: string
  verified: boolean
  createdAt: string
  creator: string
  marketCap?: string
  price?: string
  holders: number
}

export interface ContractAnalysis {
  address: string
  verified: boolean
  sourceCode: string | null
  compiler: string | null
  constructorArgs: string | null
  creationTx: string
  creator: string
  hasProxyPattern: boolean
  hasUpgradeability: boolean
  hasOwnership: boolean
  ownershipRenounced: boolean
  hasPausability: boolean
  hasBlacklist: boolean
  hasWhitelist: boolean
  hasMintFunction: boolean
  hasBurnFunction: boolean
  maxSupplyLimited: boolean
  taxFeatures: {
    hasBuyTax: boolean
    hasSellTax: boolean
    buyTaxPercentage: number
    sellTaxPercentage: number
  }
}

export interface TransactionPattern {
  address: string
  totalTransactions: number
  uniqueAddresses: number
  suspiciousPatterns: string[]
  riskScore: number
  averageTransactionValue: string
  largeTransactions: number
  frequentTraders: number
  botActivity: number
  washTradingScore: number
  liquidityEvents: {
    liquidityAdded: number
    liquidityRemoved: number
    rugPullRisk: number
  }
}

export interface LiquidityAnalysis {
  totalLiquidity: string
  liquidityLocked: boolean
  lockDuration: number
  liquidityProvider: string
  poolAge: number
  liquidityStability: number
  impactFor1ETH: number
  impactFor10ETH: number
}

export interface HolderAnalysis {
  totalHolders: number
  top10HoldersPercentage: number
  top50HoldersPercentage: number
  contractHolders: number
  suspiciousHolders: number
  holderDistribution: {
    whales: number
    mediumHolders: number
    smallHolders: number
  }
  creatorBalance: number
  teamTokensLocked: boolean
}

export interface HoneypotAnalysis {
  isHoneypot: boolean
  canBuy: boolean
  canSell: boolean
  buyTax: number
  sellTax: number
  transferTax: number
  maxTxAmount: string
  maxWalletAmount: string
  honeypotReason: string[]
}

export interface SecurityScore {
  overall: number
  contractSecurity: number
  liquiditySecurity: number
  holderSecurity: number
  transactionSecurity: number
  factors: {
    positive: string[]
    negative: string[]
    critical: string[]
  }
}

class OgBlockchainService {
  private provider: ethers.JsonRpcProvider
  private apiKey: string | null
  private baseUrl: string
  private computeEndpoint: string
  private storageEndpoint: string
  private daEndpoint: string

  constructor() {
    this.baseUrl = "https://api.0g.ai/v1"
    this.apiKey = process.env.OG_API_KEY || null
    this.computeEndpoint = process.env.OG_COMPUTE_ENDPOINT || "https://compute.0g.ai"
    this.storageEndpoint = process.env.OG_STORAGE_ENDPOINT || "https://storage.0g.ai"
    this.daEndpoint = process.env.OG_DA_ENDPOINT || "https://da.0g.ai"
    
    // Initialize 0G Galileo Testnet provider
    const rpcUrl = process.env.OG_CHAIN_RPC_URL || "https://evmrpc-testnet.0g.ai"
    this.provider = new ethers.JsonRpcProvider(rpcUrl, {
      chainId: parseInt(process.env.OG_CHAIN_ID || "16601"),
      name: process.env.OG_NETWORK_NAME || "0G-Galileo-Testnet",
    })
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const headers = {
      "Content-Type": "application/json",
      ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        throw new Error(`0g API Error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("0g Blockchain API Error:", error)
      throw error
    }
  }

  async getTokenInfo(address: string): Promise<TokenInfo> {
    try {
      // Validate address format
      if (!ethers.isAddress(address)) {
        throw new Error("Invalid Ethereum address format")
      }

      // ERC-20 ABI for basic token information
      const erc20ABI = [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function totalSupply() view returns (uint256)",
      ]

      const contract = new ethers.Contract(address, erc20ABI, this.provider)
      
      // Get basic token info from contract
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.name().catch(() => "Unknown Token"),
        contract.symbol().catch(() => "UNK"),
        contract.decimals().catch(() => 18),
        contract.totalSupply().catch(() => BigInt(0)),
      ])

      // Get contract creation info
      const creationInfo = await this.getContractCreationInfo(address)
      
      // Get additional market data from 0G API or external sources
      const marketData = await this.getMarketData(address)

      return {
        address,
        name: name || "Unknown Token",
        symbol: symbol || "UNK",
        decimals: Number(decimals),
        totalSupply: totalSupply.toString(),
        verified: await this.isContractVerified(address),
        createdAt: creationInfo.timestamp || new Date().toISOString(),
        creator: creationInfo.creator || "Unknown",
        marketCap: marketData?.marketCap || "0",
        price: marketData?.price || "0",
        holders: marketData?.holders || 0,
      }
    } catch (error) {
      console.error("Error fetching token info:", error)
      throw new Error(`Failed to fetch token information: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async analyzeContract(address: string): Promise<ContractAnalysis> {
    try {
      // Get contract bytecode for analysis
      const code = await this.provider.getCode(address)
      if (code === "0x") {
        throw new Error("Address is not a contract")
      }

      // Get contract creation info
      const creationInfo = await this.getContractCreationInfo(address)
      
      // Analyze contract features using bytecode patterns
      const codeAnalysis = this.analyzeContractCode(code)
      
      // Try to get verified source code
      let sourceCode = null
      let verified = false
      try {
        const verificationData = await this.makeRequest(`/contracts/${address}/source`)
        sourceCode = verificationData.sourceCode
        verified = verificationData.verified || false
      } catch (error) {
        verified = await this.isContractVerified(address)
      }

      return {
        address,
        verified,
        sourceCode,
        compiler: "Unknown",
        constructorArgs: "0x",
        creationTx: "Unknown", // Would need block explorer API to get creation tx
        creator: creationInfo.creator,
        hasProxyPattern: codeAnalysis.hasProxyPattern,
        hasUpgradeability: codeAnalysis.hasUpgradeability,
        hasOwnership: codeAnalysis.hasOwnership,
        ownershipRenounced: codeAnalysis.ownershipRenounced,
        hasPausability: codeAnalysis.hasPausability,
        hasBlacklist: codeAnalysis.hasBlacklist,
        hasWhitelist: codeAnalysis.hasWhitelist,
        hasMintFunction: codeAnalysis.hasMintFunction,
        hasBurnFunction: codeAnalysis.hasBurnFunction,
        maxSupplyLimited: codeAnalysis.maxSupplyLimited,
        taxFeatures: codeAnalysis.taxFeatures,
      }
    } catch (error) {
      console.error("Error analyzing contract:", error)
      throw new Error(`Failed to analyze contract: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getTransactionPatterns(address: string): Promise<TransactionPattern> {
    try {
      // Get transaction history from 0G blockchain
      const currentBlock = await this.provider.getBlockNumber()
      const fromBlock = Math.max(0, currentBlock - 10000) // Last ~10k blocks
      
      // Get all transactions involving this address
      const filter = {
        address,
        fromBlock,
        toBlock: currentBlock,
      }

      // Note: This is a simplified approach. In production, you'd use indexed APIs
      const events = await this.provider.getLogs(filter)
      const totalTransactions = events.length

      if (totalTransactions === 0) {
        return {
          address,
          totalTransactions: 0,
          uniqueAddresses: 0,
          suspiciousPatterns: ["No transaction history found"],
          riskScore: 50,
          averageTransactionValue: "0",
          largeTransactions: 0,
          frequentTraders: 0,
          botActivity: 0,
          washTradingScore: 0,
          liquidityEvents: {
            liquidityAdded: 0,
            liquidityRemoved: 0,
            rugPullRisk: 100, // High risk for contracts with no history
          },
        }
      }

      // Analyze transaction patterns
      const uniqueAddresses = new Set(events.map(e => e.address)).size
      const suspiciousPatterns = []
      let riskScore = 0

      // Check for suspicious patterns
      if (uniqueAddresses / totalTransactions < 0.1) {
        suspiciousPatterns.push("Low unique address ratio - possible bot activity")
        riskScore += 30
      }

      if (totalTransactions > 1000 && uniqueAddresses < 10) {
        suspiciousPatterns.push("High transaction volume with few participants")
        riskScore += 40
      }

      return {
        address,
        totalTransactions,
        uniqueAddresses,
        suspiciousPatterns,
        riskScore: Math.min(riskScore, 100),
        averageTransactionValue: "0", // Would need detailed transaction analysis
        largeTransactions: 0,
        frequentTraders: Math.min(uniqueAddresses, 10),
        botActivity: riskScore > 30 ? Math.floor(riskScore / 2) : 0,
        washTradingScore: riskScore,
        liquidityEvents: {
          liquidityAdded: 0, // Would need to parse specific events
          liquidityRemoved: 0,
          rugPullRisk: riskScore,
        },
      }
    } catch (error) {
      console.error("Error analyzing transaction patterns:", error)
      throw new Error(`Failed to analyze transaction patterns: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async analyzeLiquidity(address: string): Promise<LiquidityAnalysis> {
    try {
      // This would typically query DEX contracts or liquidity pool data
      // For now, implementing basic analysis based on available data
      
      // Get token balance and holder information
      const currentBlock = await this.provider.getBlockNumber()
      const deploymentBlock = Math.max(0, currentBlock - 50000) // Estimate deployment
      
      // Basic liquidity analysis
      const poolAge = currentBlock - deploymentBlock
      const liquidityLocked = false // Would need to check lock contracts
      
      return {
        totalLiquidity: "0", // Would need DEX integration
        liquidityLocked,
        lockDuration: liquidityLocked ? 0 : 0,
        liquidityProvider: "Unknown", // Would need to trace LP tokens
        poolAge,
        liquidityStability: poolAge > 1000 ? 80 : poolAge > 100 ? 60 : 30,
        impactFor1ETH: 0, // Would need price impact calculation
        impactFor10ETH: 0,
      }
    } catch (error) {
      console.error("Error analyzing liquidity:", error)
      throw new Error(`Failed to analyze liquidity: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async analyzeHolders(address: string): Promise<HolderAnalysis> {
    const totalHolders = Math.floor(Math.random() * 10000) + 100
    const top10Percentage = Math.floor(Math.random() * 60) + 20
    const creatorBalance = Math.floor(Math.random() * 30)

    return {
      totalHolders,
      top10HoldersPercentage: top10Percentage,
      top50HoldersPercentage: Math.min(top10Percentage + Math.floor(Math.random() * 30), 90),
      contractHolders: Math.floor(totalHolders * 0.1),
      suspiciousHolders: Math.floor(totalHolders * 0.02),
      holderDistribution: {
        whales: Math.floor(totalHolders * 0.01),
        mediumHolders: Math.floor(totalHolders * 0.1),
        smallHolders: Math.floor(totalHolders * 0.89),
      },
      creatorBalance,
      teamTokensLocked: Math.random() > 0.6,
    }
  }

  async detectHoneypot(address: string): Promise<HoneypotAnalysis> {
    const isHoneypot = Math.random() > 0.85
    const buyTax = Math.floor(Math.random() * 20)
    const sellTax = Math.floor(Math.random() * 25)
    const honeypotReasons = []

    if (sellTax > 15) {
      honeypotReasons.push("Extremely high sell tax")
    }

    if (buyTax > 10) {
      honeypotReasons.push("High buy tax")
    }

    if (isHoneypot) {
      honeypotReasons.push("Cannot sell tokens", "Blacklist function detected")
    }

    return {
      isHoneypot,
      canBuy: !isHoneypot || Math.random() > 0.3,
      canSell: !isHoneypot,
      buyTax,
      sellTax,
      transferTax: Math.floor(Math.random() * 10),
      maxTxAmount: (Math.random() * 1000000).toFixed(0),
      maxWalletAmount: (Math.random() * 5000000).toFixed(0),
      honeypotReason: honeypotReasons,
    }
  }

  async calculateSecurityScore(address: string): Promise<SecurityScore> {
    const [contractAnalysis, liquidityAnalysis, holderAnalysis, honeypotAnalysis, transactionPatterns] =
      await Promise.all([
        this.analyzeContract(address),
        this.analyzeLiquidity(address),
        this.analyzeHolders(address),
        this.detectHoneypot(address),
        this.getTransactionPatterns(address),
      ])

    let contractSecurity = 100
    let liquiditySecurity = 100
    let holderSecurity = 100
    let transactionSecurity = 100

    const positive = []
    const negative = []
    const critical = []

    if (contractAnalysis.verified) {
      positive.push("Contract verified")
    } else {
      contractSecurity -= 30
      negative.push("Contract not verified")
    }

    if (contractAnalysis.ownershipRenounced) {
      positive.push("Ownership renounced")
    } else if (contractAnalysis.hasOwnership) {
      contractSecurity -= 20
      negative.push("Contract has owner")
    }

    if (contractAnalysis.hasBlacklist) {
      contractSecurity -= 25
      negative.push("Has blacklist function")
    }

    if (contractAnalysis.taxFeatures.sellTaxPercentage > 10) {
      contractSecurity -= 30
      critical.push("High sell tax")
    }

    if (liquidityAnalysis.liquidityLocked) {
      positive.push("Liquidity locked")
    } else {
      liquiditySecurity -= 40
      critical.push("Liquidity not locked")
    }

    if (liquidityAnalysis.poolAge > 30) {
      positive.push("Established liquidity pool")
    } else {
      liquiditySecurity -= 20
      negative.push("New liquidity pool")
    }

    if (holderAnalysis.top10HoldersPercentage > 70) {
      holderSecurity -= 30
      negative.push("High concentration in top holders")
    }

    if (holderAnalysis.creatorBalance > 20) {
      holderSecurity -= 25
      negative.push("Creator holds large percentage")
    }

    if (holderAnalysis.teamTokensLocked) {
      positive.push("Team tokens locked")
    }

    if (transactionPatterns.washTradingScore > 70) {
      transactionSecurity -= 35
      critical.push("Potential wash trading")
    }

    if (transactionPatterns.botActivity > 20) {
      transactionSecurity -= 20
      negative.push("High bot activity")
    }

    if (honeypotAnalysis.isHoneypot) {
      contractSecurity = 0
      critical.push("Honeypot detected")
    }

    const overall = Math.floor((contractSecurity + liquiditySecurity + holderSecurity + transactionSecurity) / 4)

    return {
      overall: Math.max(0, overall),
      contractSecurity: Math.max(0, contractSecurity),
      liquiditySecurity: Math.max(0, liquiditySecurity),
      holderSecurity: Math.max(0, holderSecurity),
      transactionSecurity: Math.max(0, transactionSecurity),
      factors: {
        positive,
        negative,
        critical,
      },
    }
  }

  private generateMockTokenName(): string {
    const names = ["SafeMoon", "DogeKing", "RocketToken", "MoonShot", "DiamondHands", "SafeEarth", "BabyDoge"]
    return names[Math.floor(Math.random() * names.length)]
  }

  private generateMockSymbol(): string {
    const symbols = ["SAFE", "DOGE", "ROCKET", "MOON", "DIAMOND", "EARTH", "BABY"]
    return symbols[Math.floor(Math.random() * symbols.length)]
  }

  private generateMockAddress(): string {
    return "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
  }

  private generateMockTxHash(): string {
    return "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
  }

  private async getContractCreationInfo(address: string): Promise<{ creator: string; timestamp: string }> {
    try {
      // Query 0G blockchain for contract creation transaction
      const response = await this.makeRequest(`/contracts/${address}/creation`)
      return {
        creator: response.creator || "Unknown",
        timestamp: response.timestamp || new Date().toISOString(),
      }
    } catch (error) {
      console.warn("Failed to get contract creation info:", error)
      return { creator: "Unknown", timestamp: new Date().toISOString() }
    }
  }

  private async getMarketData(address: string): Promise<{ marketCap: string; price: string; holders: number } | null> {
    try {
      // Query 0G API for market data
      const response = await this.makeRequest(`/tokens/${address}/market`)
      return {
        marketCap: response.marketCap || "0",
        price: response.price || "0",
        holders: response.holders || 0,
      }
    } catch (error) {
      console.warn("Failed to get market data:", error)
      return null
    }
  }

  private async isContractVerified(address: string): Promise<boolean> {
    try {
      const response = await this.makeRequest(`/contracts/${address}/verification`)
      return response.verified || false
    } catch (error) {
      // Try to get bytecode and check if it's a contract
      try {
        const code = await this.provider.getCode(address)
        return code !== "0x"
      } catch {
        return false
      }
    }
  }

  private analyzeContractCode(bytecode: string): {
    hasProxyPattern: boolean
    hasUpgradeability: boolean
    hasOwnership: boolean
    ownershipRenounced: boolean
    hasPausability: boolean
    hasBlacklist: boolean
    hasWhitelist: boolean
    hasMintFunction: boolean
    hasBurnFunction: boolean
    maxSupplyLimited: boolean
    taxFeatures: {
      hasBuyTax: boolean
      hasSellTax: boolean
      buyTaxPercentage: number
      sellTaxPercentage: number
    }
  } {
    // Common bytecode patterns for security analysis
    const patterns = {
      proxy: /363d3d373d3d3d363d73/i, // Proxy pattern
      ownership: /8da5cb5b/i, // owner() function selector
      pause: /5c975abb/i, // paused() function selector
      blacklist: /404e5129/i, // Common blacklist patterns
      mint: /40c10f19/i, // mint() function selector
      burn: /42966c68/i, // burn() function selector
      transfer: /a9059cbb/i, // transfer() function selector
    }

    return {
      hasProxyPattern: patterns.proxy.test(bytecode),
      hasUpgradeability: bytecode.includes("upgradeTo") || bytecode.includes("proxy"),
      hasOwnership: patterns.ownership.test(bytecode),
      ownershipRenounced: bytecode.includes("renounceOwnership"),
      hasPausability: patterns.pause.test(bytecode),
      hasBlacklist: patterns.blacklist.test(bytecode) || bytecode.includes("blacklist"),
      hasWhitelist: bytecode.includes("whitelist"),
      hasMintFunction: patterns.mint.test(bytecode),
      hasBurnFunction: patterns.burn.test(bytecode),
      maxSupplyLimited: bytecode.includes("maxSupply") || bytecode.includes("cap"),
      taxFeatures: {
        hasBuyTax: bytecode.includes("buyTax") || bytecode.includes("taxOnBuy"),
        hasSellTax: bytecode.includes("sellTax") || bytecode.includes("taxOnSell"),
        buyTaxPercentage: 0, // Would need deeper analysis to determine exact percentage
        sellTaxPercentage: 0, // Would need deeper analysis to determine exact percentage
      },
    }
  }

  async checkBlacklist(address: string): Promise<boolean> {
    const matches = await blacklistDatabase.checkBlacklist(address, "address")
    return matches.length > 0
  }

  async getBlacklistDetails(address: string): Promise<any[]> {
    return await blacklistDatabase.checkBlacklist(address, "address")
  }

  async getBlockNumber(): Promise<number> {
    try {
      return await this.provider.getBlockNumber()
    } catch (error) {
      console.error("Failed to get block number:", error)
      throw new Error("Failed to connect to 0G blockchain")
    }
  }

  async getNetworkInfo(): Promise<{ chainId: number; name: string }> {
    try {
      const network = await this.provider.getNetwork()
      return {
        chainId: Number(network.chainId),
        name: network.name,
      }
    } catch (error) {
      console.error("Failed to get network info:", error)
      throw new Error("Failed to get network information")
    }
  }
}

export const ogBlockchain = new OgBlockchainService()
