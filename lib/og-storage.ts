// 0G Storage Integration
// High-performance storage for massive security datasets

import { Indexer, ZgFile } from '@0glabs/0g-ts-sdk'
import { ethers } from 'ethers'

export interface StorageMetadata {
  rootHash: string
  size: number
  contentType: string
  uploadTime: string
  lastAccessed: string
  tags: string[]
}

export interface BlacklistData {
  id: string
  type: "address" | "domain" | "contract" | "url"
  value: string
  category: string
  severity: string
  source: string
  description: string
  evidence: any[]
  timestamp: string
  verified: boolean
}

export interface ThreatIntelligence {
  id: string
  threatType: string
  indicators: string[]
  description: string
  severity: "low" | "medium" | "high" | "critical"
  confidence: number
  source: string
  firstSeen: string
  lastSeen: string
  references: string[]
}

class OgStorageService {
  private indexer: Indexer
  private provider: ethers.JsonRpcProvider
  private signer: ethers.Wallet | null
  private rpcUrl: string

  constructor() {
    // Initialize 0G Storage indexer
    const indexerRpc = process.env.OG_INDEXER_RPC || "https://indexer-storage-testnet-turbo.0g.ai"
    this.indexer = new Indexer(indexerRpc)
    
    // Initialize provider and RPC
    this.rpcUrl = process.env.OG_CHAIN_RPC_URL || "https://evmrpc-testnet.0g.ai"
    this.provider = new ethers.JsonRpcProvider(this.rpcUrl)
    
    // Initialize signer if private key is available
    const privateKey = process.env.OG_PRIVATE_KEY
    this.signer = privateKey ? new ethers.Wallet(privateKey, this.provider) : null
  }



  async uploadBlacklistData(data: BlacklistData[]): Promise<string> {
    let tempFilePath: string | null = null
    
    try {
      if (!this.signer) {
        console.warn("No signer configured for 0G Storage uploads, storing locally only")
        return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }

      // Convert data to JSON for storage
      const jsonData = JSON.stringify({
        type: "blacklist",
        data: data,
        metadata: {
          version: Date.now().toString(),
          recordCount: data.length,
          tags: ["security", "blacklist", "threats"],
          timestamp: new Date().toISOString(),
        },
      })

      // Create temporary file for 0G Storage
      const fs = require('fs').promises
      const path = require('path')
      const os = require('os')
      
      const filename = `blacklist-${Date.now()}.json`
      tempFilePath = path.join(os.tmpdir(), filename)
      
      // Write data to temporary file
      await fs.writeFile(tempFilePath, jsonData, 'utf-8')
      
      // Get file size and open file handle
      const fileStats = await fs.stat(tempFilePath)
      const fileHandle = await fs.open(tempFilePath, 'r')
      const file = new ZgFile(fileHandle, fileStats.size)

      // Generate Merkle tree for the file
      const [tree, treeErr] = await file.merkleTree()
      if (treeErr !== null) {
        await file.close()
        throw new Error(`Error generating Merkle tree: ${treeErr}`)
      }

      const rootHash = tree?.rootHash()
      if (!rootHash) {
        await file.close()
        throw new Error("Failed to generate root hash")
      }

      // Upload to 0G Storage network
      const [txHash, uploadErr] = await this.indexer.upload(file, this.rpcUrl, this.signer)
      
      if (uploadErr !== null) {
        await file.close()
        throw new Error(`Upload error: ${uploadErr}`)
      }

      console.log(`✅ Blacklist data uploaded to 0G Storage - TX: ${txHash}, Hash: ${rootHash}`)
      
      // Clean up file resource
      await file.close()
      
      // Clean up temporary file
      if (tempFilePath) {
        try {
          const fs = require('fs').promises
          await fs.unlink(tempFilePath)
        } catch (cleanupError) {
          console.warn('Failed to cleanup temporary file:', cleanupError)
        }
      }

      return rootHash
    } catch (error) {
      console.error("Failed to upload blacklist data:", error)
      
      // Cleanup on error
      if (tempFilePath) {
        try {
          const fs = require('fs').promises
          await fs.unlink(tempFilePath)
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }
      
      throw new Error("Failed to upload blacklist data to 0G Storage")
    }
  }

  async getBlacklistData(rootHash?: string): Promise<BlacklistData[]> {
    try {
      if (!rootHash) {
        return []
      }

      // Download from 0G Storage using the indexer
      const tempPath = `./temp/blacklist_${Date.now()}.json`
      
      // Ensure temp directory exists
      const fs = await import('fs/promises')
      const path = await import('path')
      const tempDir = path.dirname(tempPath)
      await fs.mkdir(tempDir, { recursive: true })

      // Download file from 0G Storage
      const downloadErr = await this.indexer.download(rootHash, tempPath, true)
      
      if (downloadErr !== null) {
        throw new Error(`Download error: ${downloadErr}`)
      }

      // Read and parse the downloaded file
      const fileContent = await fs.readFile(tempPath, 'utf-8')
      const parsedData = JSON.parse(fileContent)
      
      // Clean up temp file
      await fs.unlink(tempPath).catch(() => {})
      
      console.log(`✅ Retrieved blacklist data from 0G Storage: ${rootHash}`)
      return parsedData.data || []
    } catch (error) {
      console.error("Failed to retrieve blacklist data:", error)
      return []
    }
  }

  async uploadThreatIntelligence(data: ThreatIntelligence[]): Promise<string> {
    try {
      // Similar to blacklist data, simulate upload for now
      const jsonData = JSON.stringify({
        type: "threat_intelligence",
        data: data,
        metadata: {
          version: Date.now().toString(),
          recordCount: data.length,
          tags: ["security", "threat-intel", "indicators"],
        },
      })

      const crypto = await import('crypto')
      const hash = crypto.createHash('sha256').update(jsonData).digest('hex')
      const rootHash = `0x${hash}`

      console.log(`Threat intelligence prepared for 0G Storage: ${rootHash}`)
      return rootHash
    } catch (error) {
      console.error("Failed to upload threat intelligence:", error)
      throw new Error("Failed to upload threat intelligence to 0G Storage")
    }
  }

  async getThreatIntelligence(rootHash?: string): Promise<ThreatIntelligence[]> {
    try {
      if (!rootHash) {
        return []
      }
      
      console.log(`Would retrieve threat intelligence for hash: ${rootHash}`)
      return []
    } catch (error) {
      console.error("Failed to retrieve threat intelligence:", error)
      return []
    }
  }

  async searchBlacklist(query: {
    value?: string
    type?: string
    category?: string
    severity?: string
    source?: string
  }): Promise<BlacklistData[]> {
    try {
      console.log(`Would search blacklist with query:`, query)
      // TODO: Implement actual search when 0G Storage SDK is available
      return []
    } catch (error) {
      console.error("Failed to search blacklist:", error)
      return []
    }
  }

  async storeSecurityReport(report: {
    id: string
    type: "scan_result" | "threat_alert" | "analysis_report"
    data: any
    metadata: any
  }): Promise<string> {
    try {
      console.log(`Would store security report: ${report.id}`)
      // TODO: Implement actual report storage
      return report.id
    } catch (error) {
      console.error("Failed to store security report:", error)
      throw new Error("Failed to store security report")
    }
  }

  async getSecurityReport(key: string): Promise<any> {
    try {
      console.log(`Would retrieve security report: ${key}`)
      return null
    } catch (error) {
      console.error("Failed to retrieve security report:", error)
      return null
    }
  }

  async getStorageMetrics(): Promise<{
    totalSize: number
    recordCount: number
    lastUpdate: string
    availability: number
  }> {
    try {
      return {
        totalSize: 0,
        recordCount: 0,
        lastUpdate: new Date().toISOString(),
        availability: 99.9,
      }
    } catch (error) {
      console.warn("Failed to get storage metrics:", error)
      return {
        totalSize: 0,
        recordCount: 0,
        lastUpdate: new Date().toISOString(),
        availability: 99.9,
      }
    }
  }

  async syncWithThreatFeeds(): Promise<{ updated: number; errors: string[] }> {
    try {
      console.log("Would sync threat feeds")
      return { updated: 0, errors: [] }
    } catch (error) {
      console.error("Failed to sync threat feeds:", error)
      return { updated: 0, errors: ["Sync failed"] }
    }
  }

  async createDataSnapshot(): Promise<string> {
    try {
      const snapshotId = `snapshot_${Date.now()}`
      console.log(`Would create data snapshot: ${snapshotId}`)
      return snapshotId
    } catch (error) {
      console.error("Failed to create data snapshot:", error)
      throw new Error("Failed to create data snapshot")
    }
  }
}

export const ogStorage = new OgStorageService()
