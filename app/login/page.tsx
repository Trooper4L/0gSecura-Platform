'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AppLogo } from '@/components/app-logo'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!auth) {
      setError('Authentication service not available')
      return
    }
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(userCredential.user, { displayName: name })
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
      router.push('/wallet-link'); // Redirect to wallet linking instead of the main page
    } catch (err: any) {
      let friendlyMessage = 'An unexpected error occurred.'
      switch (err.code) {
        case 'auth/email-already-in-use':
          friendlyMessage = 'This email is already in use. Please sign in or use a different email.'
          break
        case 'auth/invalid-email':
          friendlyMessage = 'Please enter a valid email address.'
          break
        case 'auth/weak-password':
          friendlyMessage = 'The password is too weak. It should be at least 6 characters long.'
          break
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          friendlyMessage = 'Invalid email or password. Please try again.'
          break
        default:
          friendlyMessage = err.message
      }
      setError(friendlyMessage)
    }
  }

  const handlePasswordReset = async () => {
    if (!email) {
      setError("Please enter your email address to reset your password.");
      return;
    }
    if (!auth) {
      setError('Authentication service not available');
      return;
    }
    setError(null);
    setMessage(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Please check your inbox.");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null)
    if (!auth) {
      setError('Authentication service not available')
      return
    }
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
      router.push('/wallet-link'); // Redirect to wallet linking
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <Button
        variant="ghost"
        className="absolute top-4 left-4"
        onClick={() => router.push('/')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-lg">
              <AppLogo />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">0gSecura</h1>
            </div>
          </Link>
          <CardTitle>{isSignUp ? 'Create an Account' : 'Welcome Back'}</CardTitle>
          <CardDescription>
            {isSignUp ? 'Enter your details to get started.' : 'Sign in to access your account.'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {message && (
              <Alert variant="default">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            {isSignUp && (
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {!isSignUp && (
                <div className="text-right text-sm">
                  <Button type="button" variant="link" className="p-0 h-auto" onClick={handlePasswordReset}>Forgot Password?</Button>
                </div>
              )}
            </div>
            <Button type="submit" className="w-full">
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </CardContent>
        </form>
        <CardFooter className="flex flex-col gap-4">
          <div className="text-sm">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError(null)
              }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </Button>
          </div>
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
            {/* You can add a Google icon here */}
            Google
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}