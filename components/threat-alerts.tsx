"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  AlertTriangle,
  Shield,
  ExternalLink,
  Clock,
  TrendingUp,
  Users,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Plus,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface SecurityAlert {
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
  evidence: any[]
  tags: string[]
  upvotes: number
  downvotes: number
  verificationStatus: "unverified" | "community-verified" | "expert-verified"
}

interface AlertStats {
  totalAlerts: number
  activeAlerts: number
  resolvedAlerts: number
  criticalAlerts: number
  alertsByType: Record<string, number>
  alertsByDay: { date: string; count: number }[]
}

export function ThreatAlerts() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [stats, setStats] = useState<AlertStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null)
  const [activeTab, setActiveTab] = useState("active")
  const [showReportDialog, setShowReportDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchAlerts()
    fetchStats()
  }, [activeTab])

  const fetchAlerts = async () => {
    try {
      const status = activeTab === "all" ? undefined : activeTab
      const response = await fetch(`/api/alerts?${status ? `status=${status}` : ""}`)
      const data = await response.json()
      setAlerts(data.alerts || [])
    } catch (error) {
      console.error("Failed to fetch alerts:", error)
      toast({
        title: "Error",
        description: "Failed to load security alerts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/alerts/stats")
      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  const handleVote = async (alertId: string, vote: "up" | "down") => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "vote", vote }),
      })

      if (response.ok) {
        fetchAlerts()
        toast({
          title: "Vote Recorded",
          description: "Thank you for your feedback",
        })
      }
    } catch (error) {
      console.error("Failed to vote:", error)
    }
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "phishing":
      case "fake-website":
        return <ExternalLink className="w-4 h-4" />
      case "scam-token":
      case "honeypot":
        return <AlertTriangle className="w-4 h-4" />
      case "malicious-contract":
      case "rug-pull":
        return <Shield className="w-4 h-4" />
      default:
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case "expert-verified":
        return <Badge className="bg-green-100 text-green-800">Expert Verified</Badge>
      case "community-verified":
        return <Badge className="bg-blue-100 text-blue-800">Community Verified</Badge>
      default:
        return <Badge variant="outline">Unverified</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            Security Alerts
          </CardTitle>
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
      {/* Alert Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.activeAlerts}</div>
                  <div className="text-sm text-slate-600">Active Alerts</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.criticalAlerts}</div>
                  <div className="text-sm text-slate-600">Critical</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.resolvedAlerts}</div>
                  <div className="text-sm text-slate-600">Resolved</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.totalAlerts}</div>
                  <div className="text-sm text-slate-600">Total Alerts</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Alerts Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                Security Threat Alerts
              </CardTitle>
              <CardDescription>Real-time security alerts from the 0g blockchain ecosystem</CardDescription>
            </div>
            <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Report Threat
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Report Security Threat</DialogTitle>
                  <DialogDescription>Help protect the community by reporting suspicious activity</DialogDescription>
                </DialogHeader>
                <ReportThreatForm onClose={() => setShowReportDialog(false)} onSubmit={fetchAlerts} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="investigating">Investigating</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4 mt-6">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No alerts found for the selected category.</div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${
                      alert.status === "active" && alert.severity === "critical"
                        ? "bg-red-50 border-red-200"
                        : alert.status === "active"
                          ? "bg-orange-50 border-orange-200"
                          : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(alert.type)}
                        <div>
                          <h4 className="font-semibold">{alert.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getSeverityColor(alert.severity)}>{alert.severity.toUpperCase()}</Badge>
                            {getVerificationBadge(alert.verificationStatus)}
                            <Badge variant={alert.status === "active" ? "destructive" : "secondary"}>
                              {alert.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setSelectedAlert(alert)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Details
                      </Button>
                    </div>

                    <p className="text-sm text-slate-600 mb-3">{alert.description}</p>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                        <span>{alert.affectedUsers} users affected</span>
                        <span>Reported by {alert.reportedBy}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVote(alert.id, "up")}
                          className="h-6 px-2"
                        >
                          <ThumbsUp className="w-3 h-3 mr-1" />
                          {alert.upvotes}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVote(alert.id, "down")}
                          className="h-6 px-2"
                        >
                          <ThumbsDown className="w-3 h-3 mr-1" />
                          {alert.downvotes}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Alert Details Dialog */}
      {selectedAlert && (
        <AlertDetailsDialog alert={selectedAlert} onClose={() => setSelectedAlert(null)} onVote={handleVote} />
      )}
    </div>
  )
}

function ReportThreatForm({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [formData, setFormData] = useState({
    type: "",
    severity: "",
    title: "",
    description: "",
    affectedAddress: "",
    tags: "",
  })
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          reportedBy: "community",
          tags: formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      })

      if (response.ok) {
        toast({
          title: "Threat Reported",
          description: "Thank you for helping keep the community safe",
        })
        onSubmit()
        onClose()
      } else {
        throw new Error("Failed to submit report")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit threat report",
        variant: "destructive",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Threat Type</label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="phishing">Phishing</SelectItem>
              <SelectItem value="scam-token">Scam Token</SelectItem>
              <SelectItem value="malicious-contract">Malicious Contract</SelectItem>
              <SelectItem value="fake-website">Fake Website</SelectItem>
              <SelectItem value="honeypot">Honeypot</SelectItem>
              <SelectItem value="rug-pull">Rug Pull</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Severity</label>
          <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Title</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Brief description of the threat"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium">Affected Address/URL</label>
        <Input
          value={formData.affectedAddress}
          onChange={(e) => setFormData({ ...formData, affectedAddress: e.target.value })}
          placeholder="Contract address or website URL"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Detailed description of the threat and evidence"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium">Tags (comma-separated)</label>
        <Input
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="defi, wallet, phishing"
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          Submit Report
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function AlertDetailsDialog({
  alert,
  onClose,
  onVote,
}: {
  alert: SecurityAlert
  onClose: () => void
  onVote: (id: string, vote: "up" | "down") => void
}) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {alert.type === "phishing" ? <ExternalLink className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            {alert.title}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Badge
              className={
                alert.severity === "critical"
                  ? "bg-red-100 text-red-800"
                  : alert.severity === "high"
                    ? "bg-orange-100 text-orange-800"
                    : alert.severity === "medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-blue-100 text-blue-800"
              }
            >
              {alert.severity.toUpperCase()}
            </Badge>
            <Badge variant={alert.status === "active" ? "destructive" : "secondary"}>{alert.status}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Description</h4>
            <p className="text-sm text-slate-600">{alert.description}</p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Affected Address</h4>
            <code className="text-sm bg-slate-100 p-2 rounded block break-all">{alert.affectedAddress}</code>
          </div>

          {alert.evidence.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Evidence</h4>
              <div className="space-y-2">
                {alert.evidence.map((evidence, index) => (
                  <div key={index} className="p-3 bg-slate-50 rounded">
                    <div className="flex justify-between items-start mb-1">
                      <Badge variant="outline">{evidence.type}</Badge>
                      <span className="text-xs text-slate-500">{new Date(evidence.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm">{evidence.description}</p>
                    <p className="text-xs text-slate-600 mt-1">{evidence.data}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-slate-500">
              <p>Reported by {alert.reportedBy}</p>
              <p>{new Date(alert.timestamp).toLocaleString()}</p>
              <p>{alert.affectedUsers} users affected</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onVote(alert.id, "up")}>
                <ThumbsUp className="w-4 h-4 mr-1" />
                {alert.upvotes}
              </Button>
              <Button variant="outline" size="sm" onClick={() => onVote(alert.id, "down")}>
                <ThumbsDown className="w-4 h-4 mr-1" />
                {alert.downvotes}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
