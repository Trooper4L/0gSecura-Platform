// API Client for communicating with the Express.js backend

class ApiClient {
  private baseUrl: string
  private apiKey?: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    this.apiKey = process.env.NEXT_PUBLIC_API_KEY
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}/api${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'X-API-Key': this.apiKey }),
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Include cookies for session management
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API Client Error:', error)
      throw error
    }
  }

  // Health check
  async getHealth() {
    return this.makeRequest('/health')
  }

  // Scan operations
  async scanToken(address: string) {
    return this.makeRequest('/scan', {
      method: 'POST',
      body: JSON.stringify({ type: 'token', address }),
    })
  }

  async scanWebsite(address: string) {
    return this.makeRequest('/scan', {
      method: 'POST',
      body: JSON.stringify({ type: 'website', address }),
    })
  }

  // Blacklist operations
  async getBlacklistEntries(params: {
    type?: string
    category?: string
    severity?: string
    status?: string
    search?: string
    limit?: number
    offset?: number
  } = {}) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })

    return this.makeRequest(`/blacklist?${searchParams}`)
  }

  async addBlacklistEntry(data: {
    type: string
    value: string
    category: string
    severity: string
    source: string
    description: string
    reportedBy: string
    tags?: string[]
  }) {
    return this.makeRequest('/blacklist', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getBlacklistStats() {
    return this.makeRequest('/blacklist/stats')
  }

  async checkBlacklist(value: string, type: string) {
    return this.makeRequest(`/blacklist/check?value=${encodeURIComponent(value)}&type=${type}`)
  }

  // Alert operations
  async getAlerts(params: {
    type?: string
    severity?: string
    status?: string
    limit?: number
  } = {}) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })

    return this.makeRequest(`/alerts?${searchParams}`)
  }

  async createAlert(data: {
    type: string
    severity: string
    title: string
    description: string
    affectedAddress: string
    reportedBy: string
    affectedDomain?: string
    tags?: string[]
  }) {
    return this.makeRequest('/alerts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getAlertStats() {
    return this.makeRequest('/alerts/stats')
  }

  async getAlert(id: string) {
    return this.makeRequest(`/alerts/${id}`)
  }

  async voteOnAlert(id: string, vote: 'up' | 'down') {
    return this.makeRequest(`/alerts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'vote', vote }),
    })
  }

  async updateAlertStatus(id: string, status: string) {
    return this.makeRequest(`/alerts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'update-status', status }),
    })
  }

  async addEvidence(id: string, evidence: any) {
    return this.makeRequest(`/alerts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'add-evidence', evidence }),
    })
  }

  // Network status
  async getNetworkStatus() {
    const health = await this.getHealth()
    return health.services?.blockchain || { status: 'unknown' }
  }
}

export const apiClient = new ApiClient()
