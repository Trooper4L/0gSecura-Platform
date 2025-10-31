'use client'

import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, User as UserIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function AuthButton() {
  const { user, setUser } = useAuth() // Destructure setUser from the context
  const { toast } = useToast()

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    setUser(null); // Clear the user from the global state
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  }

  // This component now specifically handles Firebase users
  if (user && user.firebaseUser) {
    const firebaseUser = user.firebaseUser;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={firebaseUser.photoURL || ''} alt={firebaseUser.displayName || ''} />
              <AvatarFallback>{firebaseUser.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">Signed in as</p>
              <p className="text-xs leading-none text-muted-foreground">{firebaseUser.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" /><span>Log out</span></DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // If there's no Firebase user, show the link to the login page
  return (
    <Link href="/login">
      <Button variant="outline">
        <UserIcon className="mr-2 h-4 w-4" />
        Login / Sign Up
      </Button>
    </Link>
  )
}