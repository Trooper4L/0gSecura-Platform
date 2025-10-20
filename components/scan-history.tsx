'use client'

import React, { useState, useEffect } from 'react'
import { History, Clock, Shield, Globe, Filter, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/auth-context'

interface ScanHistoryEntry {
  id: string
  userId: string
  scanType: "token" | "website"
  targetAddress: string
  result: {
    trustScore: number
    status: "safe" | "caution" | "danger"
    flags: string[]
    aiAnalysis?: {
      riskScore: number
      confidence: number
      findings: string[]
      summary: string
    }
  }
  timestamp: string
  chainId: number
  sessionId?: string
}

interface ScanHistoryData {
  scans: ScanHistoryEntry[]
  totalScans: number
  userStats: {
    totalScans: number
    lastScan: string
    safeScans: number
    dangerScans: number
    cautionScans: number
  }
  pagination: {
    limit: number
    offset: number
    total: number
    hasMore: boolean
  }
}

export function ScanHistory() {
  const { user } = useAuth() // Get the authenticated user
  const [historyData, setHistoryData] = useState<ScanHistoryData | null>(null)
  const [loading, setLoading] = useState(true) // Default to true to handle initial load
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [offset, setOffset] = useState(0)
  const { toast } = useToast()

  const LIMIT = 20;

  useEffect(() => {
    // Only fetch data if the user is authenticated
    if (user?.walletAddress) {
      setOffset(0)
      setHistoryData(null)
      loadScanHistory(0, false)
    } else {
      // If there's no user, stop loading and clear data
      setLoading(false)
      setHistoryData(null)
    }
  }, [filterType, filterStatus, user]) // Re-run when filters or user change

  // Auto-refresh when page becomes visible (in case user just connected wallet)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleRefresh()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const loadScanHistory = async (currentOffset = 0, isLoadMore = false) => {
    const walletAddress = user?.walletAddress;
    // Guard clause: Do not fetch if there is no wallet address
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    if (isLoadMore) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    setError('')

    try {
      const params = new URLSearchParams()
      params.append('walletAddress', walletAddress); // Add wallet address to the request
      if (filterType !== 'all') params.append('type', filterType)
      if (filterStatus !== 'all') params.append('status', filterStatus)
      params.append('limit', String(LIMIT))
      params.append('offset', String(currentOffset))
      const response = await fetch(`/api/scan-history?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load scan history')
      }

      const data = await response.json()
      if (isLoadMore) {
        // Append new scans to the existing list
        setHistoryData(prevData => ({
          ...data.data,
          scans: [...(prevData?.scans || []), ...data.data.scans],
        }))
      } else {
        // Replace the data for a fresh load/filter
        setHistoryData(data.data)
      }
      setOffset(currentOffset + data.data.scans.length)
    } catch (error: any) {
      setError(error.message)
      console.error('Failed to load scan history:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleRefresh = () => {
    setOffset(0)
    loadScanHistory(0, false)
  }

  const deleteScan = async (scanId: string) => {
    const walletAddress = user?.walletAddress;
    if (!walletAddress) {
      toast({
        title: "Authentication Error",
        description: "Please connect your wallet to perform this action.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Pass walletAddress in the body for backend verification
      const response = await fetch(`/api/scan-history`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId, walletAddress }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete scan')
      }

      toast({
        title: "Scan Deleted",
        description: "Scan has been removed from your history",
      })

      // Reload history from the start
      setOffset(0)
      loadScanHistory(0, false)
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const handleLoadMore = () => {
    if (historyData?.pagination.hasMore && !loadingMore) {
      loadScanHistory(offset, true)
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-green-600 bg-green-50 border-green-200'
      case 'caution': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'danger': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-slate-600 bg-slate-50 border-slate-200'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatAddress = (address: string) => {
    if (address.startsWith('http')) {
      try {
        return new URL(address).hostname
      } catch {
        return address.slice(0, 30) + '...'
      }
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (!user?.walletAddress && !loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Scan History
          </CardTitle>
          <CardDescription>
            Your security scans stored on 0G Storage network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
              Connect Your Wallet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Please connect your wallet to view your scan history.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Scan History
            </CardTitle>
            <CardDescription>
              Your security scans stored on 0G Storage network
            </CardDescription>
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {/* Stats */}
        {historyData && (
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded">
              <div className="text-2xl font-bold">{historyData.userStats.totalScans}</div>
              <div className="text-xs text-slate-600">Total Scans</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded">
              <div className="text-2xl font-bold text-green-600">{historyData.userStats.safeScans}</div>
              <div className="text-xs text-green-600">Safe</div>
            </div>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded">
              <div className="text-2xl font-bold text-orange-600">{historyData.userStats.cautionScans}</div>
              <div className="text-xs text-orange-600">Caution</div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded">
              <div className="text-2xl font-bold text-red-600">{historyData.userStats.dangerScans}</div>
              <div className="text-xs text-red-600">Danger</div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Scan Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="token">Tokens</SelectItem>
                <SelectItem value="website">Websites</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="safe">Safe</SelectItem>
              <SelectItem value="caution">Caution</SelectItem>
              <SelectItem value="danger">Danger</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Scan History List */}
        <div className="space-y-4">
          {loading && !historyData ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-slate-600 mt-2">Loading scan history from 0G Storage...</p>
            </div>
          ) : !historyData || historyData.scans.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                No Scan History Yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Start scanning tokens and websites to build your security history
              </p>
              <div className="max-w-md mx-auto p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300">
                  <strong>Powered by 0G Storage:</strong> All your scans are automatically saved to the decentralized 0G Storage network for permanent access and security.
                </p>
              </div>
            </div>
          ) : (
            historyData.scans.map((scan) => (
              <div key={scan.id} className={`p-4 rounded-lg border ${getStatusColor(scan.result.status)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {scan.scanType === 'token' ? (
                        <Shield className="w-5 h-5" />
                      ) : (
                        <Globe className="w-5 h-5" />
                      )}
                      <div>
                        <div className="font-medium">
                          {scan.scanType === 'token' ? 'Token Scan' : 'Website Scan'}
                        </div>
                        <div className="text-sm text-slate-600">
                          {formatAddress(scan.targetAddress)}
                        </div>
                      </div>
                      <Badge variant={scan.result.status === 'safe' ? 'default' : 
                                   scan.result.status === 'caution' ? 'secondary' : 'destructive'}>
                        {scan.result.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTimestamp(scan.timestamp)}
                      </div>
                      <div>Trust Score: {scan.result.trustScore}/100</div>
                      {scan.result.aiAnalysis && (
                        <div>AI Confidence: {scan.result.aiAnalysis.confidence}%</div>
                      )}
                    </div>

                    {/* Findings */}
                    {scan.result.flags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {scan.result.flags.slice(0, 3).map((flag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {flag}
                          </Badge>
                        ))}
                        {scan.result.flags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{scan.result.flags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* AI Summary */}
                    {scan.result.aiAnalysis?.summary && (
                      <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                        {scan.result.aiAnalysis.summary}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {scan.scanType === 'website' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a 
                          href={scan.targetAddress} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteScan(scan.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More */}
        {historyData && historyData.pagination.hasMore && (
          <div className="text-center mt-6">
            <Button variant="outline" onClick={handleLoadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading...' : 'Load More Scans'}
            </Button>
          </div>
        )}

        {/* 0G Storage Info */}
        {historyData && historyData.scans.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Powered by 0G Storage:</strong> Your scan history is securely stored on the 0G decentralized storage network, 
              ensuring data permanence and availability across the network.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
