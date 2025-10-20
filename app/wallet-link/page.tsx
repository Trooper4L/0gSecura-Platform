'use client'

import { WalletConnect } from "@/components/wallet-connect"
import { AppLogo } from "@/components/app-logo"
import { useAuth } from "@/context/auth-context"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function WalletLinkPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Redirect to main dashboard if wallet is already linked
  useEffect(() => {
    if (user && user.firebaseUser && user.walletAddress) {
      router.push('/');
    }
  }, [user, router]);
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-lg">
            <AppLogo />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">0gSecura</h1>
        </div>
        
        <h2 className="text-2xl font-bold mb-2">Almost There!</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          To complete your secure sign-in, please connect your wallet. This verifies you as the owner of this account.
        </p>
        
        <div className="flex justify-center">
          <WalletConnect />
        </div>
        
        <p className="text-xs text-slate-500 mt-8">
          Connecting your wallet is a required step for security and to enable on-chain features.
        </p>
      </div>
    </div>
  )
}