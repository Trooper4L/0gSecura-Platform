'use client'

import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth' // Rename to avoid naming conflicts
import { auth, app } from '@/lib/firebase'
import { Loader2 } from 'lucide-react'
import { FirebaseApp } from 'firebase/app'

// --- 1. Define a unified user type for the application ---
// This represents the user's state, whether from Firebase or a connected wallet.
export interface AppUser {
  isAuthenticated: boolean;
  walletAddress?: string; // For wallet-based auth
  firebaseUser?: FirebaseUser; // For traditional Firebase auth
}

// --- 2. Update the context to use the new user type and expose setUser ---
interface AuthContextType {
  user: AppUser | null;
  setUser: React.Dispatch<React.SetStateAction<AppUser | null>>; // Make setUser available to components
  loading: boolean;
  app: FirebaseApp | null;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  setUser: () => {}, // Default empty function
  loading: true, 
  app: null 
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // This listener handles Firebase's auth state (e.g., for email/password or social logins)
    if (!auth) {
      setLoading(false)
      return
    }
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // If a Firebase user is found, we set a unified user object
        setUser({ 
          isAuthenticated: true,
          firebaseUser: firebaseUser,
          // You could potentially link a wallet address here if you store it in the Firebase user's profile
        });
      }
      // If no Firebase user is found, we don't automatically sign out,
      // as the user might be authenticating via their wallet.
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    )
  }

  // --- 3. Provide the new user state and setUser function to the app ---
  return <AuthContext.Provider value={{ user, setUser, loading, app: app || null }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
