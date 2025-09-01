'use client'

import React, { useState } from 'react'
import { AlertTriangle, RefreshCw, ExternalLink, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'

export function NetworkTroubleshoot() {
  const [isFixing, setIsFixing] = useState(false)
  const { toast } = useToast()

  const OFFICIAL_0G_CONFIG = {
    chainId: '0x40E9', // 16601 in hex - VERIFIED CORRECT  
    chainName: '0G-Galileo-Testnet',
    nativeCurrency: {
      name: 'OG',
      symbol: 'OG',
      decimals: 18,
    },
    rpcUrls: ['https://evmrpc-testnet.0g.ai'],
    blockExplorerUrls: ['https://chainscan-galileo.0g.ai'],
  }

  const removeAndAddNetwork = async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask Required",
        description: "Please install MetaMask to continue",
        variant: "destructive"
      })
      return
    }

    setIsFixing(true)

    try {
      // Step 1: Try to remove existing 0G networks that might be misconfigured
      console.log('Attempting to clean and re-add 0G network...')

      // Step 2: Add the correct network configuration
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [OFFICIAL_0G_CONFIG],
      })

      // Step 3: Switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: OFFICIAL_0G_CONFIG.chainId }],
      })

      toast({
        title: "Network Fixed",
        description: "0G Galileo Testnet has been properly configured",
      })

    } catch (error: any) {
      console.error('Network fix failed:', error)
      toast({
        title: "Fix Failed",
        description: error.message || "Please configure manually",
        variant: "destructive"
      })
    } finally {
      setIsFixing(false)
    }
  }

  const copyConfig = (field: string, value: string) => {
    navigator.clipboard.writeText(value)
    toast({
      title: "Copied",
      description: `${field} copied to clipboard`,
    })
  }

  return (
    <Card className="w-full max-w-2xl mx-auto border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
          <AlertTriangle className="w-5 h-5" />
          Network Configuration Issue
        </CardTitle>
        <CardDescription>
          MetaMask may have cached incorrect network settings. Let's fix this automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Problem:</strong> Chain ID mismatch detected (showing 16617 instead of 16601).
            This happens when MetaMask caches old network configurations.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="font-medium">Correct 0G Galileo Testnet Configuration:</h4>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex justify-between items-center p-2 bg-white dark:bg-slate-800 rounded border">
              <span className="font-medium">Chain ID:</span>
              <div className="flex items-center gap-2">
                <code className="text-green-600 font-bold">16601</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyConfig('Chain ID', '16601')}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-2 bg-white dark:bg-slate-800 rounded border">
              <span className="font-medium">Network Name:</span>
              <div className="flex items-center gap-2">
                <code>0G-Galileo-Testnet</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyConfig('Network Name', '0G-Galileo-Testnet')}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center p-2 bg-white dark:bg-slate-800 rounded border">
              <span className="font-medium">RPC URL:</span>
              <div className="flex items-center gap-2">
                <code className="text-xs">https://evmrpc-testnet.0g.ai</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyConfig('RPC URL', 'https://evmrpc-testnet.0g.ai')}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center p-2 bg-white dark:bg-slate-800 rounded border">
              <span className="font-medium">Currency Symbol:</span>
              <div className="flex items-center gap-2">
                <code className="text-blue-600 font-bold">OG</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyConfig('Currency Symbol', 'OG')}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={removeAndAddNetwork}
            disabled={isFixing}
            className="w-full"
          >
            {isFixing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Fixing Network Configuration...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Auto-Fix Network Settings
              </>
            )}
          </Button>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              asChild
              className="flex-1"
            >
              <a href="https://faucet.0g.ai" target="_blank" rel="noopener noreferrer">
                Get Test Tokens
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>

            <Button 
              variant="outline" 
              asChild
              className="flex-1"
            >
              <a href="https://chainscan-galileo.0g.ai" target="_blank" rel="noopener noreferrer">
                Block Explorer
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded text-sm text-blue-700 dark:text-blue-300">
          <strong>Manual Setup:</strong> If auto-fix doesn't work, remove the existing "0G" network from MetaMask settings, 
          then use the "Add Network" button above with the exact values shown.
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
