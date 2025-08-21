// Comprehensive Blacklist Database System
// Manages malicious addresses, domains, and contracts with community verification

export interface BlacklistEntry {
  id: string
  type: "address" | "domain" | "contract" | "url"
  value: string
  category: "scam" | "phishing" | "honeypot" | "rug-pull" | "malware" | "fake-website" | "suspicious"
  severity: "critical" | "high" | "medium" | "low"
  source: "community" | "expert" | "automated" | "threat-intel" | "partner"
  description: string
  evidence: BlacklistEvidence[]
  reportedBy: string
  verifiedBy?: string
  timestamp: string
  lastUpdated: string
  status: "active" | "pending" | "disputed" | "resolved" | "false-positive"
  confidence: number // 0-100
  reports: number
  upvotes: number
  downvotes: number
  tags: string[]
  relatedEntries: string[]
  expiresAt?: string
}

export interface BlacklistEvidence {
  type: "transaction" | "screenshot" | "code-analysis" | "user-report" | "external-source"
  description: string
  data: string
  source: string
  timestamp: string
  verified: boolean
}

export interface BlacklistStats {
  totalEntries: number
  activeEntries: number
  pendingEntries: number
  entriesByCategory: Record<string, number>
  entriesByType: Record<string, number>
  entriesBySource: Record<string, number>
  recentAdditions: number
  communityReports: number
  verificationRate: number
}

export interface BlacklistQuery {
  type?: string
  category?: string
  severity?: string
  source?: string
  status?: string
  search?: string
  limit?: number
  offset?: number
}

class BlacklistDatabaseService {
  private entries: Map<string, BlacklistEntry>
  private domainIndex: Map<string, string[]>
  private addressIndex: Map<string, string[]>

  constructor() {
    this.entries = new Map()
    this.domainIndex = new Map()
    this.addressIndex = new Map()
    this.initializeDatabase()
  }

  private initializeDatabase() {
    const initialEntries: Omit<BlacklistEntry, "id" | "timestamp" | "lastUpdated">[] = [
      {
        type: "address",
        value: "0x1234567890abcdef1234567890abcdef12345678",
        category: "scam",
        severity: "critical",
        source: "expert",
        description: "Known scam token contract that steals user funds through honeypot mechanism",
        evidence: [
          {
            type: "code-analysis",
            description: "Contract contains hidden sell restrictions",
            data: "Function _transfer contains blacklist check that prevents selling",
            source: "automated-scanner",
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            verified: true,
          },
        ],
        reportedBy: "security-team",
        verifiedBy: "expert-analyst",
        status: "active",
        confidence: 95,
        reports: 23,
        upvotes: 45,
        downvotes: 2,
        tags: ["honeypot", "scam-token", "defi"],
        relatedEntries: [],
      },
      {
        type: "domain",
        value: "0g-wallet-fake.com",
        category: "phishing",
        severity: "critical",
        source: "community",
        description: "Fake wallet website that steals private keys and seed phrases",
        evidence: [
          {
            type: "screenshot",
            description: "Website mimics official wallet interface",
            data: "Screenshot showing identical design to legitimate wallet",
            source: "community-report",
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            verified: true,
          },
        ],
        reportedBy: "community-user-123",
        verifiedBy: "security-team",
        status: "active",
        confidence: 90,
        reports: 67,
        upvotes: 89,
        downvotes: 1,
        tags: ["phishing", "wallet", "fake-website"],
        relatedEntries: [],
      },
      {
        type: "address",
        value: "0xabcdef1234567890abcdef1234567890abcdef12",
        category: "rug-pull",
        severity: "high",
        source: "automated",
        description: "Contract with backdoor functions allowing arbitrary token transfers",
        evidence: [
          {
            type: "code-analysis",
            description: "Hidden admin functions detected",
            data: "Function emergencyWithdraw allows owner to drain all funds",
            source: "automated-scanner",
            timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            verified: true,
          },
        ],
        reportedBy: "automated-scanner",
        status: "active",
        confidence: 85,
        reports: 12,
        upvotes: 34,
        downvotes: 3,
        tags: ["rug-pull", "backdoor", "defi"],
        relatedEntries: [],
      },
      {
        type: "domain",
        value: "0g-ai-secure.com",
        category: "phishing",
        severity: "critical",
        source: "threat-intel",
        description: "Typosquatting domain mimicking official 0g.ai website",
        evidence: [
          {
            type: "external-source",
            description: "Reported by multiple threat intelligence sources",
            data: "Domain registered recently with similar branding to 0g.ai",
            source: "threat-intel-feed",
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            verified: true,
          },
        ],
        reportedBy: "threat-intel-system",
        verifiedBy: "security-team",
        status: "active",
        confidence: 98,
        reports: 156,
        upvotes: 234,
        downvotes: 0,
        tags: ["typosquatting", "phishing", "official-impersonation"],
        relatedEntries: [],
      },
      {
        type: "url",
        value: "https://fake-metamask-security.net/connect",
        category: "phishing",
        severity: "high",
        source: "community",
        description: "Fake MetaMask connection page that steals wallet credentials",
        evidence: [
          {
            type: "user-report",
            description: "Multiple users reported credential theft",
            data: "Users report losing funds after connecting wallet to this URL",
            source: "community-reports",
            timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
            verified: true,
          },
        ],
        reportedBy: "community-moderator",
        status: "active",
        confidence: 88,
        reports: 43,
        upvotes: 67,
        downvotes: 4,
        tags: ["wallet-connect", "phishing", "metamask-fake"],
        relatedEntries: [],
      },
    ]

    initialEntries.forEach((entry) => {
      const id = this.generateId()
      const fullEntry: BlacklistEntry = {
        ...entry,
        id,
        timestamp: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      }
      this.addEntry(fullEntry)
    })
  }

  private generateId(): string {
    return `bl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private addEntry(entry: BlacklistEntry) {
    this.entries.set(entry.id, entry)
    this.updateIndexes(entry)
  }

  private updateIndexes(entry: BlacklistEntry) {
    if (entry.type === "domain" || entry.type === "url") {
      const domain = entry.type === "url" ? new URL(entry.value).hostname : entry.value
      const existing = this.domainIndex.get(domain) || []
      existing.push(entry.id)
      this.domainIndex.set(domain, existing)
    }

    if (entry.type === "address" || entry.type === "contract") {
      const address = entry.value.toLowerCase()
      const existing = this.addressIndex.get(address) || []
      existing.push(entry.id)
      this.addressIndex.set(address, existing)
    }
  }

  async checkBlacklist(value: string, type: "address" | "domain" | "url"): Promise<BlacklistEntry[]> {
    const matches: BlacklistEntry[] = []

    if (type === "address") {
      const entryIds = this.addressIndex.get(value.toLowerCase()) || []
      for (const id of entryIds) {
        const entry = this.entries.get(id)
        if (entry && entry.status === "active") {
          matches.push(entry)
        }
      }
    } else if (type === "domain" || type === "url") {
      const domain = type === "url" ? new URL(value).hostname : value
      const entryIds = this.domainIndex.get(domain) || []
      for (const id of entryIds) {
        const entry = this.entries.get(id)
        if (entry && entry.status === "active") {
          matches.push(entry)
        }
      }

      // Also check for partial domain matches (subdomains)
      for (const [indexedDomain, entryIds] of this.domainIndex.entries()) {
        if (domain.includes(indexedDomain) || indexedDomain.includes(domain)) {
          for (const id of entryIds) {
            const entry = this.entries.get(id)
            if (entry && entry.status === "active" && !matches.find((m) => m.id === entry.id)) {
              matches.push(entry)
            }
          }
        }
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence)
  }

  async getAllEntries(query: BlacklistQuery = {}): Promise<{ entries: BlacklistEntry[]; total: number }> {
    let entries = Array.from(this.entries.values())

    // Apply filters
    if (query.type) {
      entries = entries.filter((entry) => entry.type === query.type)
    }
    if (query.category) {
      entries = entries.filter((entry) => entry.category === query.category)
    }
    if (query.severity) {
      entries = entries.filter((entry) => entry.severity === query.severity)
    }
    if (query.source) {
      entries = entries.filter((entry) => entry.source === query.source)
    }
    if (query.status) {
      entries = entries.filter((entry) => entry.status === query.status)
    }
    if (query.search) {
      const searchLower = query.search.toLowerCase()
      entries = entries.filter(
        (entry) =>
          entry.value.toLowerCase().includes(searchLower) ||
          entry.description.toLowerCase().includes(searchLower) ||
          entry.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
      )
    }

    const total = entries.length

    // Sort by confidence and timestamp
    entries.sort((a, b) => {
      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

    // Apply pagination
    if (query.offset) {
      entries = entries.slice(query.offset)
    }
    if (query.limit) {
      entries = entries.slice(0, query.limit)
    }

    return { entries, total }
  }

  async getEntryById(id: string): Promise<BlacklistEntry | null> {
    return this.entries.get(id) || null
  }

  async addBlacklistEntry(
    entry: Omit<BlacklistEntry, "id" | "timestamp" | "lastUpdated" | "reports" | "upvotes" | "downvotes">,
  ): Promise<BlacklistEntry> {
    const newEntry: BlacklistEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      reports: 1,
      upvotes: 0,
      downvotes: 0,
    }

    this.addEntry(newEntry)
    return newEntry
  }

  async updateEntry(id: string, updates: Partial<BlacklistEntry>): Promise<boolean> {
    const entry = this.entries.get(id)
    if (!entry) return false

    const updatedEntry = {
      ...entry,
      ...updates,
      lastUpdated: new Date().toISOString(),
    }

    this.entries.set(id, updatedEntry)
    this.updateIndexes(updatedEntry)
    return true
  }

  async voteOnEntry(id: string, vote: "up" | "down"): Promise<boolean> {
    const entry = this.entries.get(id)
    if (!entry) return false

    if (vote === "up") {
      entry.upvotes++
    } else {
      entry.downvotes++
    }

    // Update confidence based on votes
    const totalVotes = entry.upvotes + entry.downvotes
    if (totalVotes > 0) {
      const positiveRatio = entry.upvotes / totalVotes
      entry.confidence = Math.min(95, Math.max(10, Math.floor(entry.confidence * 0.8 + positiveRatio * 100 * 0.2)))
    }

    entry.lastUpdated = new Date().toISOString()
    this.entries.set(id, entry)
    return true
  }

  async addEvidence(id: string, evidence: Omit<BlacklistEvidence, "timestamp" | "verified">): Promise<boolean> {
    const entry = this.entries.get(id)
    if (!entry) return false

    const newEvidence: BlacklistEvidence = {
      ...evidence,
      timestamp: new Date().toISOString(),
      verified: false,
    }

    entry.evidence.push(newEvidence)
    entry.lastUpdated = new Date().toISOString()
    this.entries.set(id, entry)
    return true
  }

  async getStats(): Promise<BlacklistStats> {
    const entries = Array.from(this.entries.values())
    const now = new Date()
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const entriesByCategory: Record<string, number> = {}
    const entriesByType: Record<string, number> = {}
    const entriesBySource: Record<string, number> = {}

    let recentAdditions = 0
    let communityReports = 0
    let verifiedEntries = 0

    entries.forEach((entry) => {
      entriesByCategory[entry.category] = (entriesByCategory[entry.category] || 0) + 1
      entriesByType[entry.type] = (entriesByType[entry.type] || 0) + 1
      entriesBySource[entry.source] = (entriesBySource[entry.source] || 0) + 1

      if (new Date(entry.timestamp) >= last24Hours) {
        recentAdditions++
      }

      if (entry.source === "community") {
        communityReports++
      }

      if (entry.verifiedBy) {
        verifiedEntries++
      }
    })

    return {
      totalEntries: entries.length,
      activeEntries: entries.filter((e) => e.status === "active").length,
      pendingEntries: entries.filter((e) => e.status === "pending").length,
      entriesByCategory,
      entriesByType,
      entriesBySource,
      recentAdditions,
      communityReports,
      verificationRate: entries.length > 0 ? Math.floor((verifiedEntries / entries.length) * 100) : 0,
    }
  }

  async searchSimilar(value: string, type: "address" | "domain"): Promise<BlacklistEntry[]> {
    const entries = Array.from(this.entries.values())
    const similar: BlacklistEntry[] = []

    entries.forEach((entry) => {
      if (entry.type === type && entry.status === "active") {
        const similarity = this.calculateSimilarity(value.toLowerCase(), entry.value.toLowerCase())
        if (similarity > 0.7 && similarity < 1.0) {
          similar.push(entry)
        }
      }
    })

    return similar.sort((a, b) => b.confidence - a.confidence)
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1

    if (longer.length === 0) return 1.0

    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        }
      }
    }

    return matrix[str2.length][str1.length]
  }
}

export const blacklistDatabase = new BlacklistDatabaseService()
