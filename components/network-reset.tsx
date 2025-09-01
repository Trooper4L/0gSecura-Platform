'use client'

import React, { useState } from 'react'
import { RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'

export function NetworkReset() {
  const [isResetting, setIsResetting] = useState(false)
  const [rpcTest, setRpcTest] = useState<any>(null)
  const { toast } = useToast()

  const testRPC = async () => {
    try {
      const response = await fetch('/api/test-rpc')
      const data = await response.json()
      setRpcTest(data)
      
      if (!data.success) {
        toast({
          title: "RPC Test Failed",
          description: data.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "RPC Test Failed",
        description: "Could not test RPC endpoint",
        variant: "destructive"
      })
    }
  }

  const resetNetwork = async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask Required",
        description: "Please install MetaMask",
        variant: "destructive"
      })
      return
    }

    setIsResetting(true)

    try {
      // Add network with EXACT configuration from RPC test
      const exactConfig = {
        chainId: '0x40E9', // 16601 - must match RPC exactly
        chainName: '0G-Galileo-Testnet',
        nativeCurrency: {
          name: 'OG',
          symbol: 'OG',
          decimals: 18,
        },
        rpcUrls: ['https://evmrpc-testnet.0g.ai'],
        blockExplorerUrls: ['https://chainscan-galileo.0g.ai'],
      }

      console.log('Resetting network with config:', exactConfig)

      // First try to add the network (will overwrite existing if same chainId)
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [exactConfig],
      })

      // Then switch to it
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: exactConfig.chainId }],
      })

      toast({
        title: "Network Reset Complete",
        description: "0G Galileo Testnet has been properly configured",
      })

    } catch (error: any) {
      console.error('Network reset failed:', error)
      toast({
        title: "Reset Failed",
        description: error.message || "Manual configuration required",
        variant: "destructive"
      })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Network Connection Debug
        </CardTitle>
        <CardDescription>
          Test RPC endpoint and reset MetaMask network configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Issue:</strong> Chain ID mismatch usually means MetaMask cached wrong network settings.
            Use the tools below to diagnose and fix the issue.
          </AlertDescription>
        </Alert>

        <div className="flex gap-3">
          <Button onClick={testRPC} variant="outline" className="flex-1">
            Test 0G RPC Endpoint
          </Button>
          <Button 
            onClick={resetNetwork}
            disabled={isResetting}
            className="flex-1"
          >
            {isResetting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Network
              </>
            )}
          </Button>
        </div>

        {rpcTest && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">RPC Test Results:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 rounded">
                <span>RPC Chain ID:</span>
                <span className={rpcTest.match?.rpcMatch ? 'text-green-600' : 'text-red-600'}>
                  {rpcTest.directRpcCall?.chainId || 'Error'}
                  {rpcTest.match?.rpcMatch ? ' ✓' : ' ✗'}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 rounded">
                <span>Expected:</span>
                <span className="text-blue-600">0x40E9 (16601)</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 rounded">
                <span>RPC Status:</span>
                <span className={rpcTest.success ? 'text-green-600' : 'text-red-600'}>
                  {rpcTest.success ? 'Working' : 'Error'}
                  {rpcTest.success ? ' ✓' : ' ✗'}
                </span>
              </div>
            </div>
            
            {rpcTest.success && rpcTest.match?.rpcMatch && (
              <Alert className="mt-3">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  ✅ RPC endpoint is working correctly and returns Chain ID 16601. 
                  The issue is likely in MetaMask's cached configuration.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded text-sm text-yellow-700 dark:text-yellow-300">
          <strong>Manual Fix:</strong> If reset doesn't work, manually delete the "0G" network in MetaMask Settings → Networks, 
          then use the "Reset Network" button above.
        </div>
      </CardContent>
    </Card>
  )
}

declare global {
  interface Window {
    ethereum?: any
  }
}
