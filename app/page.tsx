'use client'

import { AlertTriangle, ArrowRight, FunctionSquare, ListChecks, Search, Settings, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ThreatAlerts } from "@/components/threat-alerts"
import { WalletConnect } from "@/components/wallet-connect"
import { ScanHistory } from "@/components/scan-history"
import { useAuth } from "@/context/auth-context"
import { AuthButton } from "@/components/auth-button"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-950/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">0gSecura</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Protecting the 0g blockchain ecosystem</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/settings">
                <Button variant="ghost" size="icon" aria-label="Settings">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
              {user && <WalletConnect />}
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Secure Your 0g Blockchain Experience
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
            Detect phishing attacks, scam tokens, and malicious smart contracts before they can harm you. Get real-time
            security analysis powered by AI and blockchain intelligence.
          </p>
          <div className="flex justify-center mt-8">
            <Link href="/scanner">
              <Button size="lg" className="text-lg">
                Launch Scanner <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-md"><Search className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
                Token Scanner
              </CardTitle>
              <CardDescription>
                Analyze token contracts and get trust scores based on transaction patterns and developer history.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Scans Completed</span>
                  <span className="font-semibold">1,247</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Threats Detected</span>
                  <span className="font-semibold text-red-600">23</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-md"><AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" /></div>
                Phishing Detection
              </CardTitle>
              <CardDescription>
                Check websites for known phishing domains, SSL validity, and typosquatting attempts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sites Analyzed</span>
                  <span className="font-semibold">892</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Phishing Blocked</span>
                  <span className="font-semibold text-red-600">47</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-md"><Shield className="w-5 h-5 text-green-600 dark:text-green-400" /></div>
                Real-time Alerts
              </CardTitle>
              <CardDescription>
                Get instant warnings before interacting with suspicious contracts or websites.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Active Monitors</span>
                  <span className="font-semibold">156</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Alerts Sent</span>
                  <span className="font-semibold text-orange-600">8</span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Explore Security Features */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Explore Security Features
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Interactive tools to manage your assets and contribute to community safety.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card className="transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-md"><ListChecks className="w-5 h-5 text-purple-600 dark:text-purple-400" /></div>
                DApp Approval Manager
              </CardTitle>
              <CardDescription>
                Review and revoke token approvals you've granted to decentralized applications.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Active Approvals</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Risky Permissions</span>
                  <span className="font-semibold text-orange-600">2</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/approvals" className="w-full"><Button className="w-full">Launch Manager <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            </CardFooter>
          </Card>

          <Card className="transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-teal-100 dark:bg-teal-900/50 rounded-md"><FunctionSquare className="w-5 h-5 text-teal-600 dark:text-teal-400" /></div>
                Transaction Simulator
              </CardTitle>
              <CardDescription>
                Simulate transactions before signing to understand their exact outcomes and avoid scams.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Simulations Run</span>
                  <span className="font-semibold">98</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>High-Risk Actions</span>
                  <span className="font-semibold text-red-600">5</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/simulator" className="w-full"><Button className="w-full">Launch Simulator <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            </CardFooter>
          </Card>

        </div>

        {/* Scan History */}
        <div className="max-w-4xl mx-auto mb-12">
          <ScanHistory />
        </div>

        {/* Threat Alerts */}
        <ThreatAlerts />
      </main>
    </div>
  )
}
