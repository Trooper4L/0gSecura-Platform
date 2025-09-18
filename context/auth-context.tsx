'use client'

import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth, app } from '@/lib/firebase'
import { Loader2 } from 'lucide-react'
import { FirebaseApp } from 'firebase/app'

interface AuthContextType {
  user: User | null
  loading: boolean
  app: FirebaseApp | null
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, app: null })

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Show a loading spinner while auth state is being determined
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    )
  }

  return <AuthContext.Provider value={{ user, loading, app }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)