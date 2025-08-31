import { Shield, Search, AlertTriangle, CheckCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SecurityScanner } from "@/components/security-scanner"
import { ThreatAlerts } from "@/components/threat-alerts"
import { WalletConnect } from "@/components/wallet-connect"
import { NetworkSetupGuide } from "@/components/network-setup-guide"
import { NetworkTroubleshoot } from "@/components/network-troubleshoot"
import { DebugPanel } from "@/components/debug-panel"
import { ScanHistory } from "@/components/scan-history"

export default function HomePage() {
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
              <WalletConnect />
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
        </div>

        {/* Network Setup Guide */}
        <div className="max-w-4xl mx-auto mb-12">
          <NetworkSetupGuide />
        </div>

        {/* Network Troubleshoot */}
        <div className="max-w-4xl mx-auto mb-12">
          <NetworkTroubleshoot />
        </div>

        {/* Debug Panel */}
        <div className="max-w-4xl mx-auto mb-12">
          <DebugPanel />
        </div>

        {/* Security Scanner */}
        <div className="max-w-4xl mx-auto mb-12">
          <SecurityScanner />
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-600" />
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
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
