// Risk Alert System
// Manages security alerts, threat monitoring, and community reporting

export interface SecurityAlert {
  id: string
  type: "phishing" | "scam-token" | "malicious-contract" | "rug-pull" | "honeypot" | "fake-website"
  severity: "critical" | "high" | "medium" | "low"
  title: string
  description: string
  affectedAddress: string
  affectedDomain?: string
  reportedBy: string
  timestamp: string
  status: "active" | "investigating" | "resolved" | "false-positive"
  affectedUsers: number
  evidence: AlertEvidence[]
  tags: string[]
  upvotes: number
  downvotes: number
  verificationStatus: "unverified" | "community-verified" | "expert-verified"
}

export interface AlertEvidence {
  type: "transaction" | "screenshot" | "code-analysis" | "user-report"
  description: string
  data: string
  timestamp: string
  submittedBy: string
}

export interface AlertSubscription {
  userId: string
  alertTypes: string[]
  severityLevels: string[]
  keywords: string[]
  notificationMethods: ("email" | "push" | "webhook")[]
}

export interface AlertStats {
  totalAlerts: number
  activeAlerts: number
  resolvedAlerts: number
  criticalAlerts: number
  alertsByType: Record<string, number>
  alertsByDay: { date: string; count: number }[]
}

class AlertSystemService {
  private alerts: Map<string, SecurityAlert>
  private subscriptions: Map<string, AlertSubscription>

  constructor() {
    this.alerts = new Map()
    this.subscriptions = new Map()
    this.initializeMockAlerts()
  }

  private initializeMockAlerts() {
    const mockAlerts: SecurityAlert[] = [
      {
        id: "alert-001",
        type: "phishing",
        severity: "critical",
        title: "Fake 0g Wallet Extension Detected",
        description:
          "A malicious browser extension mimicking the official 0g wallet has been identified. It attempts to steal private keys and seed phrases.",
        affectedAddress: "chrome-extension://fake0gwallet",
        reportedBy: "security-team",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: "active",
        affectedUsers: 156,
        evidence: [
          {
            type: "code-analysis",
            description: "Malicious code found in extension manifest",
            data: "Extension requests excessive permissions and contains obfuscated code",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            submittedBy: "security-team",
          },
        ],
        tags: ["browser-extension", "wallet", "phishing"],
        upvotes: 23,
        downvotes: 1,
        verificationStatus: "expert-verified",
      },
      {
        id: "alert-002",
        type: "scam-token",
        severity: "high",
        title: "Honeypot Token: FAKE0G",
        description:
          "Token contract allows buying but prevents selling. Multiple users report inability to sell tokens after purchase.",
        affectedAddress: "0x1234567890abcdef1234567890abcdef12345678",
        reportedBy: "community",
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        status: "active",
        affectedUsers: 23,
        evidence: [
          {
            type: "transaction",
            description: "Failed sell transactions",
            data: "Multiple failed sell attempts with gas consumption",
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            submittedBy: "user-reports",
          },
          {
            type: "code-analysis",
            description: "Contract analysis reveals honeypot pattern",
            data: "Sell function contains hidden restrictions",
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            submittedBy: "automated-analysis",
          },
        ],
        tags: ["honeypot", "scam-token", "defi"],
        upvotes: 45,
        downvotes: 2,
        verificationStatus: "community-verified",
      },
      {
        id: "alert-003",
        type: "malicious-contract",
        severity: "medium",
        title: "Suspicious DeFi Contract",
        description:
          "Smart contract contains backdoor functions that could potentially drain user funds. Exercise extreme caution.",
        affectedAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
        reportedBy: "automated-scanner",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        status: "resolved",
        affectedUsers: 8,
        evidence: [
          {
            type: "code-analysis",
            description: "Backdoor function detected",
            data: "Hidden admin function allows arbitrary token transfers",
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            submittedBy: "automated-scanner",
          },
        ],
        tags: ["backdoor", "defi", "smart-contract"],
        upvotes: 12,
        downvotes: 0,
        verificationStatus: "expert-verified",
      },
      {
        id: "alert-004",
        type: "fake-website",
        severity: "critical",
        title: "Fake 0g.ai Domain",
        description:
          "Phishing website using similar domain to official 0g.ai. Attempts to steal wallet connections and private keys.",
        affectedAddress: "https://0g-ai-secure.com",
        affectedDomain: "0g-ai-secure.com",
        reportedBy: "community",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        status: "active",
        affectedUsers: 34,
        evidence: [
          {
            type: "screenshot",
            description: "Website mimics official 0g.ai design",
            data: "Screenshot showing identical layout and branding",
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            submittedBy: "community-reporter",
          },
        ],
        tags: ["phishing", "website", "typosquatting"],
        upvotes: 67,
        downvotes: 0,
        verificationStatus: "community-verified",
      },
    ]

    mockAlerts.forEach((alert) => {
      this.alerts.set(alert.id, alert)
    })
  }

  async getAllAlerts(filters?: {
    type?: string
    severity?: string
    status?: string
    limit?: number
  }): Promise<SecurityAlert[]> {
    let alerts = Array.from(this.alerts.values())

    if (filters) {
      if (filters.type) {
        alerts = alerts.filter((alert) => alert.type === filters.type)
      }
      if (filters.severity) {
        alerts = alerts.filter((alert) => alert.severity === filters.severity)
      }
      if (filters.status) {
        alerts = alerts.filter((alert) => alert.status === filters.status)
      }
      if (filters.limit) {
        alerts = alerts.slice(0, filters.limit)
      }
    }

    return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  async getAlertById(id: string): Promise<SecurityAlert | null> {
    return this.alerts.get(id) || null
  }

  async createAlert(
    alertData: Omit<SecurityAlert, "id" | "timestamp" | "upvotes" | "downvotes">,
  ): Promise<SecurityAlert> {
    const alert: SecurityAlert = {
      ...alertData,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      upvotes: 0,
      downvotes: 0,
    }

    this.alerts.set(alert.id, alert)
    return alert
  }

  async updateAlertStatus(id: string, status: SecurityAlert["status"]): Promise<boolean> {
    const alert = this.alerts.get(id)
    if (!alert) return false

    alert.status = status
    this.alerts.set(id, alert)
    return true
  }

  async voteOnAlert(id: string, vote: "up" | "down"): Promise<boolean> {
    const alert = this.alerts.get(id)
    if (!alert) return false

    if (vote === "up") {
      alert.upvotes++
    } else {
      alert.downvotes++
    }

    this.alerts.set(id, alert)
    return true
  }

  async addEvidence(alertId: string, evidence: Omit<AlertEvidence, "timestamp">): Promise<boolean> {
    const alert = this.alerts.get(alertId)
    if (!alert) return false

    const newEvidence: AlertEvidence = {
      ...evidence,
      timestamp: new Date().toISOString(),
    }

    alert.evidence.push(newEvidence)
    this.alerts.set(alertId, alert)
    return true
  }

  async getAlertStats(): Promise<AlertStats> {
    const alerts = Array.from(this.alerts.values())
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const alertsByType: Record<string, number> = {}
    const alertsByDay: { date: string; count: number }[] = []

    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      alertsByDay.push({
        date: date.toISOString().split("T")[0],
        count: 0,
      })
    }

    alerts.forEach((alert) => {
      // Count by type
      alertsByType[alert.type] = (alertsByType[alert.type] || 0) + 1

      // Count by day (last 7 days)
      const alertDate = new Date(alert.timestamp)
      if (alertDate >= sevenDaysAgo) {
        const dateStr = alertDate.toISOString().split("T")[0]
        const dayEntry = alertsByDay.find((d) => d.date === dateStr)
        if (dayEntry) {
          dayEntry.count++
        }
      }
    })

    return {
      totalAlerts: alerts.length,
      activeAlerts: alerts.filter((a) => a.status === "active").length,
      resolvedAlerts: alerts.filter((a) => a.status === "resolved").length,
      criticalAlerts: alerts.filter((a) => a.severity === "critical").length,
      alertsByType,
      alertsByDay,
    }
  }

  async checkForAlerts(address: string, type: "token" | "website"): Promise<SecurityAlert[]> {
    const alerts = Array.from(this.alerts.values())
    return alerts.filter((alert) => {
      if (type === "token") {
        return alert.affectedAddress.toLowerCase() === address.toLowerCase() && alert.status === "active"
      } else {
        return (
          ((alert.affectedDomain && address.includes(alert.affectedDomain)) ||
            (alert.affectedAddress && address.includes(alert.affectedAddress))) &&
          alert.status === "active"
        )
      }
    })
  }

  async subscribeToAlerts(subscription: AlertSubscription): Promise<boolean> {
    this.subscriptions.set(subscription.userId, subscription)
    return true
  }

  async getSubscription(userId: string): Promise<AlertSubscription | null> {
    return this.subscriptions.get(userId) || null
  }
}

export const alertSystem = new AlertSystemService()
