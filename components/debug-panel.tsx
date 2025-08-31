'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export function DebugPanel() {
  const [apiStatus, setApiStatus] = useState<{
    health: 'unknown' | 'success' | 'error'
    gemini: 'unknown' | 'success' | 'error'
    healthData?: any
    geminiData?: any
  }>({
    health: 'unknown',
    gemini: 'unknown'
  })

  const [testing, setTesting] = useState(false)

  const testAPIs = async () => {
    setTesting(true)
    
    // Test Health API
    try {
      const healthResponse = await fetch('/api/health')
      const healthData = await healthResponse.json()
      setApiStatus(prev => ({
        ...prev,
        health: healthResponse.ok ? 'success' : 'error',
        healthData
      }))
    } catch (error) {
      setApiStatus(prev => ({
        ...prev,
        health: 'error',
        healthData: { error: 'Connection failed' }
      }))
    }

    // Test Gemini API
    try {
      const geminiResponse = await fetch('/api/test-gemini')
      const geminiData = await geminiResponse.json()
      setApiStatus(prev => ({
        ...prev,
        gemini: geminiResponse.ok ? 'success' : 'error',
        geminiData
      }))
    } catch (error) {
      setApiStatus(prev => ({
        ...prev,
        gemini: 'error',
        geminiData: { error: 'Connection failed' }
      }))
    }

    setTesting(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Working</Badge>
      case 'error':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Error</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Debug Panel
          <Button onClick={testAPIs} disabled={testing}>
            {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Test APIs
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Health API</span>
              {getStatusBadge(apiStatus.health)}
            </div>
            {apiStatus.healthData && (
              <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(apiStatus.healthData, null, 2)}
              </pre>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Gemini AI</span>
              {getStatusBadge(apiStatus.gemini)}
            </div>
            {apiStatus.geminiData && (
              <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(apiStatus.geminiData, null, 2)}
              </pre>
            )}
          </div>
        </div>

        <div className="text-sm text-slate-600 dark:text-slate-400">
          <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.origin : 'Unknown'}</p>
          <p><strong>API Base:</strong> {process.env.NEXT_PUBLIC_API_URL || 'Default Next.js routes'}</p>
        </div>
      </CardContent>
    </Card>
  )
}
