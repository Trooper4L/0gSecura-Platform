'use client'

import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Wallet, ChevronDown, LogOut, AlertCircle, CheckCircle, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// OFFICIAL 0G Galileo Testnet Configuration (VERIFIED)
const OG_GALILEO_TESTNET = {
  chainId: 16601, // Use decimal for internal logic
  chainIdHex: '0x40E9', // Hex for MetaMask
  chainName: '0G-Galileo-Testnet',
  nativeCurrency: {
    name: 'OG',
    symbol: 'OG', 
    decimals: 18,
  },
  rpcUrls: ['https://evmrpc-testnet.0g.ai'],
  blockExplorerUrls: ['https://chainscan-galileo.0g.ai'],
}

interface WalletState {
  isConnected: boolean
  address: string
  balance: string
  chainId: string
  isCorrectNetwork: boolean
  isAuthenticated: boolean
  userProfile: any
}

export function WalletConnect() {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: '',
    balance: '0',
    chainId: '',
    isCorrectNetwork: false,
    isAuthenticated: false,
    userProfile: null,
  })
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    checkWalletConnection()
    setupEventListeners()
  }, [])

  const setupEventListeners = () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)
    }
  }

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet()
    } else {
      updateWalletInfo()
    }
  }

  const handleChainChanged = (chainId: string) => {
    setWallet(prev => ({
      ...prev,
      chainId,
      isCorrectNetwork: chainId === OG_GALILEO_TESTNET.chainIdHex
    }))
    updateWalletInfo()
  }

  const checkWalletConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          await updateWalletInfo()
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error)
      }
    }
  }

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('Please install MetaMask or another Web3 wallet')
      return
    }

    setIsConnecting(true)
    setError('')

    try {
      // First, try to add the 0G network with official configuration
      try {
        // Use the exact configuration that matches the RPC response
        const metaMaskConfig = {
          chainId: OG_GALILEO_TESTNET.chainIdHex,
          chainName: OG_GALILEO_TESTNET.chainName,
          nativeCurrency: OG_GALILEO_TESTNET.nativeCurrency,
          rpcUrls: OG_GALILEO_TESTNET.rpcUrls,
          blockExplorerUrls: OG_GALILEO_TESTNET.blockExplorerUrls,
        }
        
        console.log('Adding network with config:', metaMaskConfig)
        
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [metaMaskConfig],
        })
      } catch (addError: any) {
        // Network might already exist, continue
        console.log('Network add attempt:', addError.message)
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      await updateWalletInfo()
      
      // Check if user needs to switch networks
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      console.log('Current chain ID:', chainId, 'Expected:', OG_GALILEO_TESTNET.chainIdHex)
      
      if (chainId !== OG_GALILEO_TESTNET.chainIdHex) {
        await switchToOGNetwork()
      }

      // Authenticate user after wallet connection
      await authenticateUser()
    } catch (error: any) {
      setError(error.message || 'Failed to connect wallet')
    } finally {
      setIsConnecting(false)
    }
  }

  const switchToOGNetwork = async () => {
    if (!window.ethereum) return

    setIsSwitchingNetwork(true)
    setError('')

    try {
      console.log('Attempting to switch to chain ID:', OG_GALILEO_TESTNET.chainIdHex)
      
      // Try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: OG_GALILEO_TESTNET.chainIdHex }],
      })
    } catch (switchError: any) {
      console.log('Switch failed, attempting to add network. Error code:', switchError.code)
      
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          const addNetworkParams = {
            chainId: OG_GALILEO_TESTNET.chainIdHex,
            chainName: OG_GALILEO_TESTNET.chainName,
            nativeCurrency: OG_GALILEO_TESTNET.nativeCurrency,
            rpcUrls: OG_GALILEO_TESTNET.rpcUrls,
            blockExplorerUrls: OG_GALILEO_TESTNET.blockExplorerUrls,
          }
          
          console.log('Adding network with params:', addNetworkParams)
          
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [addNetworkParams],
          })
        } catch (addError: any) {
          setError('Failed to add 0G Galileo Testnet: ' + addError.message)
        }
      } else {
        setError('Failed to switch network: ' + switchError.message)
      }
    } finally {
      setIsSwitchingNetwork(false)
    }
  }

  const updateWalletInfo = async () => {
    if (!window.ethereum) return

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      const balance = await provider.getBalance(address)
      const network = await provider.getNetwork()
      
      const currentChainIdHex = '0x' + network.chainId.toString(16)
      console.log('Network info - Chain ID:', currentChainIdHex, 'Expected:', OG_GALILEO_TESTNET.chainIdHex)
      
      setWallet(prev => ({
        ...prev,
        isConnected: true,
        address,
        balance: ethers.formatEther(balance),
        chainId: currentChainIdHex,
        isCorrectNetwork: currentChainIdHex === OG_GALILEO_TESTNET.chainIdHex,
      }))
    } catch (error) {
      console.error('Error updating wallet info:', error)
    }
  }

  const authenticateUser = async () => {
    if (!wallet.isConnected || !wallet.address) return

    try {
      const message = `Sign in to 0gSecura\nAddress: ${wallet.address}\nTimestamp: ${Date.now()}\nNetwork: 0G Galileo Testnet`
      
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const signature = await signer.signMessage(message)
      
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: wallet.address,
          signature,
          message,
          chainId: parseInt(wallet.chainId, 16)
        })
      })

      if (response.ok) {
        const authData = await response.json()
        setWallet(prev => ({
          ...prev,
          isAuthenticated: true,
          userProfile: authData.user
        }))
      } else {
        const error = await response.json()
        setError(error.error || 'Authentication failed')
      }
    } catch (error: any) {
      setError(error.message || 'Authentication failed')
    }
  }

  const disconnectWallet = async () => {
    // Sign out from backend
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
    } catch (error) {
      console.warn('Sign out request failed:', error)
    }

    setWallet({
      isConnected: false,
      address: '',
      balance: '0',
      chainId: '',
      isCorrectNetwork: false,
      isAuthenticated: false,
      userProfile: null,
    })
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatBalance = (balance: string) => {
    return parseFloat(balance).toFixed(4)
  }

  if (!wallet.isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Wallet className="w-6 h-6" />
            Connect Wallet
          </CardTitle>
          <CardDescription>
            Connect your wallet to access 0gSecura security features
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Button 
            onClick={connectWallet} 
            className="w-full" 
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
          </Button>
          
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">
              Required Network:
            </p>
            <div className="space-y-1 text-sm text-blue-600 dark:text-blue-400">
              <p>• Network: 0G Galileo Testnet</p>
              <p>• Chain ID: 16601</p>
              <p>• RPC: evmrpc-testnet.0g.ai</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex items-center gap-4">
      {/* Network Status */}
      <Badge variant={wallet.isCorrectNetwork ? 'default' : 'destructive'} className="flex items-center gap-1">
        {wallet.isCorrectNetwork ? (
          <>
            <CheckCircle className="w-3 h-3" />
            0G Testnet
          </>
        ) : (
          <>
            <AlertCircle className="w-3 h-3" />
            Wrong Network
          </>
        )}
      </Badge>

      {/* Network Switch Button */}
      {!wallet.isCorrectNetwork && (
        <Button
          onClick={switchToOGNetwork}
          disabled={isSwitchingNetwork}
          size="sm"
          variant="outline"
        >
          {isSwitchingNetwork ? 'Switching...' : 'Switch to 0G'}
        </Button>
      )}

      {/* Wallet Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            <div className="text-left">
              <div className="text-sm font-medium">
                {formatAddress(wallet.address)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatBalance(wallet.balance)} OG
              </div>
            </div>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-64">
          <div className="px-3 py-2">
            <p className="text-sm font-medium">Account Details</p>
            <p className="text-xs text-muted-foreground break-all">
              {wallet.address}
            </p>
          </div>
          
          <DropdownMenuSeparator />
          
          <div className="px-3 py-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span>Balance:</span>
              <span className="font-medium">{formatBalance(wallet.balance)} OG</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Network:</span>
              <span className={wallet.isCorrectNetwork ? 'text-green-600' : 'text-red-600'}>
                {wallet.isCorrectNetwork ? '0G Testnet' : 'Unsupported'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Status:</span>
              <span className={wallet.isAuthenticated ? 'text-green-600' : 'text-orange-600'}>
                {wallet.isAuthenticated ? 'Authenticated' : 'Not Signed In'}
              </span>
            </div>
            {wallet.userProfile && (
              <>
                <div className="flex justify-between text-sm">
                  <span>Reputation:</span>
                  <span className="font-medium">{wallet.userProfile.reputationScore}/1000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Scans:</span>
                  <span className="font-medium">{wallet.userProfile.totalScans}</span>
                </div>
                {wallet.userProfile.isPremium && (
                  <Badge variant="default" className="text-xs">Premium User</Badge>
                )}
              </>
            )}
          </div>
          
          <DropdownMenuSeparator />
          
          {!wallet.isCorrectNetwork && (
            <DropdownMenuItem onClick={switchToOGNetwork} disabled={isSwitchingNetwork}>
              <AlertCircle className="w-4 h-4 mr-2" />
              {isSwitchingNetwork ? 'Switching Network...' : 'Switch to 0G Testnet'}
            </DropdownMenuItem>
          )}

          {wallet.isCorrectNetwork && !wallet.isAuthenticated && (
            <DropdownMenuItem onClick={authenticateUser}>
              <User className="w-4 h-4 mr-2" />
              Sign In with Wallet
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem onClick={disconnectWallet}>
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect Wallet
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {error && (
        <Alert className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

// Global window interface extension for TypeScript
declare global {
  interface Window {
    ethereum?: any
  }
}
