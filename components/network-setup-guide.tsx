'use client'

import React from 'react'
import { Copy, ExternalLink, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'

// OFFICIAL 0G Galileo Testnet Configuration from docs
export const OG_NETWORK_CONFIG = {
  networkName: '0G-Galileo-Testnet',
  rpcUrls: ['https://evmrpc-testnet.0g.ai'],
  chainId: '0x40da', // 16602 in decimal
  chainIdDecimal: 16601,
  nativeCurrency: {
    name: 'OG',
    symbol: 'OG',
    decimals: 18,
  },
  blockExplorerUrls: ['https://chainscan-galileo.0g.ai'],
  faucetUrl: 'https://faucet.0g.ai'
}

export function NetworkSetupGuide() {
  const { toast } = useToast()

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    })
  }

  const addNetworkToMetaMask = async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask Required",
        description: "Please install MetaMask to continue",
        variant: "destructive"
      })
      return
    }

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: OG_NETWORK_CONFIG.chainId,
          chainName: OG_NETWORK_CONFIG.networkName,
          nativeCurrency: OG_NETWORK_CONFIG.nativeCurrency,
          rpcUrls: OG_NETWORK_CONFIG.rpcUrls,
          blockExplorerUrls: OG_NETWORK_CONFIG.blockExplorerUrls,
        }],
      })

      toast({
        title: "Network Added",
        description: "0G Galileo Testnet has been added to MetaMask",
      })
    } catch (error: any) {
      toast({
        title: "Failed to Add Network",
        description: error.message || "Please add the network manually",
        variant: "destructive"
      })
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-6 h-6 text-blue-600" />
          0G Galileo Testnet Setup
        </CardTitle>
        <CardDescription>
          Add the official 0G Galileo Testnet to MetaMask with correct configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> Use these EXACT settings to avoid security warnings in MetaMask.
            The Chain ID must be 16601 (not 16617).
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Network Name</label>
              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded border">
                <code className="flex-1 text-sm">{OG_NETWORK_CONFIG.networkName}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(OG_NETWORK_CONFIG.networkName, 'Network name')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Chain ID</label>
              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded border">
                <code className="flex-1 text-sm font-bold text-blue-600">{OG_NETWORK_CONFIG.chainIdDecimal}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(OG_NETWORK_CONFIG.chainIdDecimal.toString(), 'Chain ID')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">RPC URL</label>
              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded border">
                <code className="flex-1 text-sm break-all">{OG_NETWORK_CONFIG.rpcUrls[0]}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(OG_NETWORK_CONFIG.rpcUrls[0], 'RPC URL')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Currency Symbol</label>
              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded border">
                <code className="flex-1 text-sm font-bold">{OG_NETWORK_CONFIG.nativeCurrency.symbol}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(OG_NETWORK_CONFIG.nativeCurrency.symbol, 'Currency symbol')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Block Explorer URL</label>
            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded border">
              <code className="flex-1 text-sm break-all">{OG_NETWORK_CONFIG.blockExplorerUrls[0]}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(OG_NETWORK_CONFIG.blockExplorerUrls[0], 'Block explorer')}
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
              >
                <a href={OG_NETWORK_CONFIG.blockExplorerUrls[0]} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={addNetworkToMetaMask} className="flex-1">
            Add Network to MetaMask
          </Button>
          <Button 
            variant="outline" 
            asChild
            className="flex-1"
          >
            <a href={OG_NETWORK_CONFIG.faucetUrl} target="_blank" rel="noopener noreferrer">
              Get Testnet Tokens
              <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Manual Setup Instructions:
          </h4>
          <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
            <li>Open MetaMask → Click network dropdown</li>
            <li>Select "Add network" → "Add a network manually"</li>
            <li>Copy each field exactly as shown above</li>
            <li>Click "Save" and switch to the new network</li>
            <li>Get test tokens from the faucet</li>
          </ol>
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
