"use client"

import { useState, useEffect } from "react"
import { Shield, Search, Plus, AlertTriangle, CheckCircle, Clock, ThumbsUp, ThumbsDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface BlacklistEntry {
  id: string
  type: "address" | "domain" | "contract" | "url"
  value: string
  category: "scam" | "phishing" | "honeypot" | "rug-pull" | "malware" | "fake-website" | "suspicious"
  severity: "critical" | "high" | "medium" | "low"
  source: "community" | "expert" | "automated" | "threat-intel" | "partner"
  description: string
  reportedBy: string
  timestamp: string
  status: "active" | "pending" | "disputed" | "resolved" | "false-positive"
  confidence: number
  upvotes: number
  downvotes: number
  tags: string[]
}

interface BlacklistStats {
  totalEntries: number
  activeEntries: number
  pendingEntries: number
  entriesByCategory: Record<string, number>
  entriesByType: Record<string, number>
  recentAdditions: number
}

export function BlacklistManager() {
  const [entries, setEntries] = useState<BlacklistEntry[]>([])
  const [stats, setStats] = useState<BlacklistStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    type: "",
    category: "",
    severity: "",
    status: "active",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchEntries()
    fetchStats()
  }, [filters])

  const fetchEntries = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.type) params.append("type", filters.type)
      if (filters.category) params.append("category", filters.category)
      if (filters.severity) params.append("severity", filters.severity)
      if (filters.status) params.append("status", filters.status)
      if (searchTerm) params.append("search", searchTerm)
      params.append("limit", "50")

      const response = await fetch(`/api/blacklist?${params}`)
      const data = await response.json()
      setEntries(data.entries || [])
    } catch (error) {
      console.error("Failed to fetch blacklist entries:", error)
      toast({
        title: "Error",
        description: "Failed to load blacklist entries",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/blacklist/stats")
      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  const handleSearch = () => {
    fetchEntries()
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-slate-100 text-slate-800 border-slate-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case "pending":
        return <Clock className="w-4 h-4 text-orange-600" />
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      default:
        return <Shield className="w-4 h-4 text-slate-600" />
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Blacklist Database</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.activeEntries}</div>
                  <div className="text-sm text-slate-600">Active Entries</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.pendingEntries}</div>
                  <div className="text-sm text-slate-600">Pending</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.recentAdditions}</div>
                  <div className="text-sm text-slate-600">Added Today</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.totalEntries}</div>
                  <div className="text-sm text-slate-600">Total Entries</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Blacklist Manager */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-600" />
            Blacklist Database
          </CardTitle>
          <CardDescription>Comprehensive database of malicious addresses, domains, and contracts</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="space-y-4 mb-6">
            <div className="flex gap-2">
              <Input
                placeholder="Search addresses, domains, or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSearch}>
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="address">Address</SelectItem>
                  <SelectItem value="domain">Domain</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value="scam">Scam</SelectItem>
                  <SelectItem value="phishing">Phishing</SelectItem>
                  <SelectItem value="honeypot">Honeypot</SelectItem>
                  <SelectItem value="rug-pull">Rug Pull</SelectItem>
                  <SelectItem value="fake-website">Fake Website</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.severity} onValueChange={(value) => setFilters({ ...filters, severity: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Entries List */}
          <div className="space-y-4">
            {entries.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No blacklist entries found.</div>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className="p-4 border rounded-lg bg-slate-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(entry.status)}
                      <div>
                        <h4 className="font-semibold">{entry.type.toUpperCase()}</h4>
                        <code className="text-sm bg-white px-2 py-1 rounded border break-all">{entry.value}</code>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getSeverityColor(entry.severity)}>{entry.severity.toUpperCase()}</Badge>
                          <Badge variant="outline">{entry.category}</Badge>
                          <Badge variant="secondary">{entry.source}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{entry.confidence}%</div>
                      <div className="text-sm text-slate-600">Confidence</div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 mb-3">{entry.description}</p>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-4">
                      <span>Reported by {entry.reportedBy}</span>
                      <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
                      <div className="flex items-center gap-2">
                        {entry.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {entry.upvotes}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsDown className="w-3 h-3" />
                        {entry.downvotes}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
