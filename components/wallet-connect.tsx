'use client'

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Wallet, ChevronDown, LogOut, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter, usePathname } from 'next/navigation' // Import navigation hooks
import { useAuth } from '@/context/auth-context' 
import { walletAuth, OG_GALILEO_TESTNET } from '@/lib/wallet-auth' 
import { useToast } from '@/hooks/use-toast'

// This component now manages its own UI state but updates the global auth context.
export function WalletConnect() {
  const { user, setUser } = useAuth()
  const { toast } = useToast()
  const router = useRouter(); // For redirecting after connection
  const pathname = usePathname(); // To check if we are on the linking page

  const [balance, setBalance] = useState('0');
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false)
  const [error, setError] = useState('')
  
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          handleLogout();
        } else if (user?.walletAddress && accounts[0].toLowerCase() !== user.walletAddress.toLowerCase()) {
          // If the connected account changes, log out to force a re-authentication
          handleLogout();
          toast({ title: "Account Changed", description: "You have been logged out. Please re-authenticate with the new wallet." });
        }
      };
      
      const handleChainChanged = async () => {
        const network = await provider.getNetwork();
        setIsCorrectNetwork(network.chainId === BigInt(OG_GALILEO_TESTNET.chainIdNumber));
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      provider.getNetwork().then(network => {
        setIsCorrectNetwork(network.chainId === BigInt(OG_GALILEO_TESTNET.chainIdNumber));
      });
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [setUser, user, toast]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (user?.isAuthenticated && user.walletAddress && typeof window !== 'undefined' && window.ethereum) {
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

      // Update the global user state to include the new wallet address
      setUser(prevUser => {
        if (!prevUser?.firebaseUser) {
          // This case is for wallet-only sign-in, which we are now preventing in the main flow
          // but can keep for flexibility.
          return { isAuthenticated: true, walletAddress: address };
        }
        // This is the main flow: link wallet to existing Firebase user
        return { ...prevUser, walletAddress: address, isAuthenticated: true }; // Ensure isAuthenticated is true
      });

      toast({ title: "Success", description: "Wallet connected successfully." });

      // If the user is on the linking page, redirect them to the dashboard
      if (pathname === '/wallet-link') {
        router.push('/');
      }
      
    } catch (error: any) {
      setError(error.message);
      toast({ variant: "destructive", title: "Connection Failed", description: error.message });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLogout = () => {
    // A full logout should clear both wallet and firebase state.
    // The AuthButton handles the firebase part. This just clears wallet.
    setUser(prev => prev ? { ...prev, isAuthenticated: false, walletAddress: undefined } : null);
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

  // If the user has a Firebase session but no wallet, show the connect button.
  // Also show if the user has no session at all (for flexibility, though the main flow prevents this).
  if (!user?.walletAddress) {
    return (
      <Button onClick={handleConnect} disabled={isConnecting}>
        {isConnecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    )
  }

  // User has a connected wallet
  return (
    <div className="flex items-center gap-4">
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
            <p className="text-sm font-medium">Connected Wallet</p>
            <p className="text-xs text-muted-foreground break-all">{user.walletAddress}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect Wallet
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
