'use client'

import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Wallet, ChevronDown, LogOut, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel, // Add the missing import here
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/context/auth-context' // Import the global auth context
import { walletAuth, OG_GALILEO_TESTNET, UserProfile } from '@/lib/wallet-auth' // Import service and types
import { useToast } from '@/hooks/use-toast'

// This component now manages its own UI state but updates the global auth context.
export function WalletConnect() {
  const { user, setUser } = useAuth()
  const { toast } = useToast()

  const [balance, setBalance] = useState('0');
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false)
  const [error, setError] = useState('')
  
  // Local state to track network, derived from the provider
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  // Effect to check connection on load and listen for changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          handleLogout(); // User disconnected from MetaMask
        } else {
          // If account changes, require re-login for security
          setUser(null);
        }
      };
      
      const handleChainChanged = async () => {
        const network = await provider.getNetwork();
        setIsCorrectNetwork(network.chainId === BigInt(OG_GALILEO_TESTNET.chainIdNumber));
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Initial check
      provider.getNetwork().then(network => {
        setIsCorrectNetwork(network.chainId === BigInt(OG_GALILEO_TESTNET.chainIdNumber));
      });
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [setUser]);

  // Effect to fetch balance when user is authenticated
  useEffect(() => {
    const fetchBalance = async () => {
      if (user?.isAuthenticated && user.walletAddress) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const userBalance = await provider.getBalance(user.walletAddress);
          setBalance(ethers.formatEther(userBalance));
        } catch (e) {
          console.error("Failed to fetch balance:", e);
        }
      }
    };
    fetchBalance();
  }, [user]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');

    if (!walletAuth.isWalletAvailable()) {
      toast({ variant: "destructive", title: "Error", description: "MetaMask or a compatible wallet is not installed." });
      setIsConnecting(false);
      return;
    }

    try {
      const address = await walletAuth.connectWallet();
      await walletAuth.ensureCorrectNetwork();

      const message = `Welcome to 0gSecura! Sign this message to authenticate.\n\nTimestamp: ${Date.now()}`;
      const signer = await new ethers.BrowserProvider(window.ethereum).getSigner();
      const signature = await signer.signMessage(message);

      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature, message }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.details || 'Server verification failed.');

      if (data.isRegistered) {
        setUser({ walletAddress: address, isAuthenticated: true });
        toast({ title: "Success", description: "Wallet connected and authenticated." });
      } else {
        toast({ title: "Registration Required", description: "Please confirm the transaction to register your wallet." });
        const txHash = await walletAuth.registerUser();
        setUser({ walletAddress: address, isAuthenticated: true });
        toast({ title: "Registration Complete", description: `You are now registered. Tx: ${txHash.substring(0, 10)}...` });
      }
    } catch (error: any) {
      setError(error.message);
      toast({ variant: "destructive", title: "Connection Failed", description: error.message });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    toast({ title: "Disconnected", description: "Your wallet has been disconnected." });
  };

  const switchToOGNetwork = async () => {
    setIsSwitchingNetwork(true);
    try {
      await walletAuth.switchToOGNetwork();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Network Switch Failed", description: error.message });
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;
  const formatBalance = (balance: string) => parseFloat(balance).toFixed(4);

  if (!user || !user.isAuthenticated || !user.walletAddress) {
    return (
      <Button onClick={handleConnect} disabled={isConnecting}>
        {isConnecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
        Connect Wallet
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <Badge variant={isCorrectNetwork ? 'default' : 'destructive'} className="flex items-center gap-1">
        {isCorrectNetwork ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
        {isCorrectNetwork ? '0G Testnet' : 'Wrong Network'}
      </Badge>

      {!isCorrectNetwork && (
        <Button onClick={switchToOGNetwork} disabled={isSwitchingNetwork} size="sm" variant="outline">
          {isSwitchingNetwork ? 'Switching...' : 'Switch to 0G'}
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            <div className="text-left">
              <div className="text-sm font-medium">{formatAddress(user.walletAddress)}</div>
              <div className="text-xs text-muted-foreground">{formatBalance(balance)} OG</div>
            </div>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            <p className="text-sm font-medium">Account</p>
            <p className="text-xs text-muted-foreground break-all">{user.walletAddress}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
