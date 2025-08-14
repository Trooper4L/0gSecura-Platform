// 0G Storage Integration
// High-performance storage for massive security datasets

export interface StorageMetadata {
  key: string
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
  private endpoint: string
  private apiKey: string | null

  constructor() {
    this.endpoint = process.env.OG_STORAGE_ENDPOINT || "https://storage.0g.ai"
    this.apiKey = process.env.OG_API_KEY || null
  }

  private async makeRequest(path: string, options: RequestInit = {}) {
    const url = `${this.endpoint}/api/v1${path}`
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
        throw new Error(`0G Storage API Error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("0G Storage API Error:", error)
      throw error
    }
  }

  async uploadBlacklistData(data: BlacklistData[]): Promise<string> {
    try {
      const response = await this.makeRequest("/data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "blacklist",
          data: data,
          metadata: {
            version: Date.now().toString(),
            recordCount: data.length,
            tags: ["security", "blacklist", "threats"],
          },
        }),
      })

      return response.key
    } catch (error) {
      console.error("Failed to upload blacklist data:", error)
      throw new Error("Failed to upload blacklist data to 0G Storage")
    }
  }

  async getBlacklistData(key?: string): Promise<BlacklistData[]> {
    try {
      const path = key ? `/data/${key}` : "/data/latest?type=blacklist"
      const response = await this.makeRequest(path)
      return response.data || []
    } catch (error) {
      console.error("Failed to retrieve blacklist data:", error)
      return []
    }
  }

  async uploadThreatIntelligence(data: ThreatIntelligence[]): Promise<string> {
    try {
      const response = await this.makeRequest("/data", {
        method: "POST",
        body: JSON.stringify({
          type: "threat_intelligence",
          data: data,
          metadata: {
            version: Date.now().toString(),
            recordCount: data.length,
            tags: ["security", "threat-intel", "indicators"],
          },
        }),
      })

      return response.key
    } catch (error) {
      console.error("Failed to upload threat intelligence:", error)
      throw new Error("Failed to upload threat intelligence to 0G Storage")
    }
  }

  async getThreatIntelligence(key?: string): Promise<ThreatIntelligence[]> {
    try {
      const path = key ? `/data/${key}` : "/data/latest?type=threat_intelligence"
      const response = await this.makeRequest(path)
      return response.data || []
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
      const searchParams = new URLSearchParams()
      Object.entries(query).forEach(([key, value]) => {
        if (value) searchParams.append(key, value)
      })

      const response = await this.makeRequest(`/search/blacklist?${searchParams}`)
      return response.results || []
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
      const response = await this.makeRequest("/reports", {
        method: "POST",
        body: JSON.stringify({
          ...report,
          timestamp: new Date().toISOString(),
          retention: "1y", // Keep reports for 1 year
        }),
      })

      return response.key
    } catch (error) {
      console.error("Failed to store security report:", error)
      throw new Error("Failed to store security report")
    }
  }

  async getSecurityReport(key: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/reports/${key}`)
      return response.data
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
      const response = await this.makeRequest("/metrics")
      return {
        totalSize: response.totalSize || 0,
        recordCount: response.recordCount || 0,
        lastUpdate: response.lastUpdate || new Date().toISOString(),
        availability: response.availability || 99.9,
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
      const response = await this.makeRequest("/sync/threat-feeds", {
        method: "POST",
      })
      
      return {
        updated: response.updated || 0,
        errors: response.errors || [],
      }
    } catch (error) {
      console.error("Failed to sync threat feeds:", error)
      return { updated: 0, errors: ["Sync failed"] }
    }
  }

  async createDataSnapshot(): Promise<string> {
    try {
      const response = await this.makeRequest("/snapshots", {
        method: "POST",
        body: JSON.stringify({
          type: "full_backup",
          includeMetadata: true,
          compression: true,
        }),
      })

      return response.snapshotId
    } catch (error) {
      console.error("Failed to create data snapshot:", error)
      throw new Error("Failed to create data snapshot")
    }
  }
}

export const ogStorage = new OgStorageService()
