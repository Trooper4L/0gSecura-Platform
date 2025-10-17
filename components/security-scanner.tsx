"use client"

import { useState } from "react"
import { Search, Shield, AlertTriangle, CheckCircle, Copy, Globe, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { analyzeContractSecurity, analyzeWebsiteSecurity } from "@/lib/0g/compute-service"

interface ScanResult {
  type: "token" | "website"
  address: string
  trustScore: number
  status: "safe" | "caution" | "danger"
  flags: string[]
  details: {
    contractVerified?: boolean
    liquidityLocked?: boolean
    ownershipRenounced?: boolean
    sslValid?: boolean
    domainAge?: number
    phishingMatch?: boolean
    tokenInfo?: any
    contractAnalysis?: any
    transactionPatterns?: any
    phishingAnalysis?: any
    riskScore?: number
  }
}

export function SecurityScanner() {
  const [activeTab, setActiveTab] = useState("token")
  const [scanInput, setScanInput] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanProgress, setScanProgress] = useState(0)
  const { toast } = useToast()

  const validateInput = (input: string, type: string): string | null => {
    if (!input.trim()) {
      return "Please enter a valid input"
    }

    if (type === "token") {
      // Basic Ethereum address validation (0x followed by 40 hex characters)
      const addressRegex = /^0x[a-fA-F0-9]{40}$/
      if (!addressRegex.test(input.trim())) {
        return "Please enter a valid contract address (0x...)"
      }
    } else if (type === "website") {
      try {
        new URL(input.startsWith("http") ? input : `https://${input}`)
      } catch {
        return "Please enter a valid URL"
      }
    }

    return null
  }

  const handleScan = async () => {
    const validationError = validateInput(scanInput, activeTab)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsScanning(true)
    setScanResult(null)
    setError(null)
    setScanProgress(0)

    try {
      // Simulate progress updates while waiting for the API response
      const progressInterval = setInterval(() => {
        setScanProgress((prev) => (prev >= 90 ? 90 : prev + 10))
      }, 200)

      // Call the new server-side API route
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeTab === "token" ? "contract" : "website",
          value: scanInput.trim(),
        }),
      })

      clearInterval(progressInterval)
      setScanProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || "Failed to analyze")
      }

      const result = await response.json()
      setScanResult(result)

      toast({
        title: "Scan Complete",
        description: `Security analysis completed for ${activeTab}.`,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(errorMessage)
      toast({
        title: "Scan Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsScanning(false)
      setTimeout(() => setScanProgress(0), 1000)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Address copied to clipboard",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "safe":
        return "text-green-600"
      case "caution":
        return "text-orange-600"
      case "danger":
        return "text-red-600"
      default:
        return "text-slate-600"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "safe":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "caution":
        return <AlertTriangle className="w-5 h-5 text-orange-600" />
      case "danger":
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      default:
        return <Shield className="w-5 h-5 text-slate-600" />
    }
  }

  const getProgressColor = (score: number) => {
    if (score >= 70) return "bg-green-500"
    if (score >= 40) return "bg-orange-500"
    return "bg-red-500"
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-6 h-6 text-blue-600" />
          Security Scanner
        </CardTitle>
        <CardDescription>
          Analyze tokens, smart contracts, and websites for potential security threats using 0g blockchain data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="token" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Token/Contract
            </TabsTrigger>
            <TabsTrigger value="website" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Website/URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="token" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Contract Address</label>
              <div className="flex gap-2">
                <Input
                  placeholder="0x1234567890abcdef1234567890abcdef12345678"
                  value={scanInput}
                  onChange={(e) => {
                    setScanInput(e.target.value)
                    setError(null)
                  }}
                  className="flex-1 font-mono text-sm"
                />
                <Button onClick={handleScan} disabled={isScanning || !scanInput.trim()}>
                  {isScanning ? "Scanning..." : "Scan Token"}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Enter a token contract address or smart contract address on the 0g blockchain
              </p>
            </div>
          </TabsContent>

          <TabsContent value="website" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Website URL</label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com or example.com"
                  value={scanInput}
                  onChange={(e) => {
                    setScanInput(e.target.value)
                    setError(null)
                  }}
                  className="flex-1"
                />
                <Button onClick={handleScan} disabled={isScanning || !scanInput.trim()}>
                  {isScanning ? "Scanning..." : "Check Website"}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Enter a website URL to check for phishing attempts and security issues
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert className="mt-4" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isScanning && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-slate-600">
                {scanProgress < 30
                  ? activeTab === "token"
                    ? "Connecting to 0g blockchain..."
                    : "Analyzing website security..."
                  : scanProgress < 60
                    ? activeTab === "token"
                      ? "Analyzing contract patterns..."
                      : "Checking phishing databases..."
                    : scanProgress < 90
                      ? "Checking threat databases..."
                      : "Finalizing security report..."}
              </span>
            </div>
            <Progress value={scanProgress} className="w-full" />
          </div>
        )}

        {scanResult && (
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(scanResult.status)}
                <div>
                  <div className={`font-bold text-lg ${getStatusColor(scanResult.status)}`}>
                    {scanResult.status.toUpperCase()}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Security Status</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{scanResult.trustScore}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Trust Score</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Trust Score</span>
                <span className="font-medium">{scanResult.trustScore}/100</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(scanResult.trustScore)}`}
                  style={{ width: `${scanResult.trustScore}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Analyzed {scanResult.type === "token" ? "Address" : "URL"}</label>
              <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded border">
                <code className="flex-1 text-sm font-mono break-all">{scanResult.address}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(scanResult.address)}
                  className="shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Security Flags */}
            <div className="space-y-3">
              <h4 className="font-semibold">Security Analysis</h4>
              <div className="flex flex-wrap gap-2">
                {scanResult.flags.map((flag, index) => (
                  <Badge
                    key={index}
                    variant={flag.startsWith("✅") ? "default" : flag.startsWith("🚨") ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {flag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Detailed Analysis */}
            {scanResult.type === "token" && scanResult.details && (
              <div className="space-y-3">
                <h4 className="font-semibold">Contract Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded">
                    <span>Contract Verified:</span>
                    <span className={scanResult.details.contractVerified ? "text-green-600" : "text-red-600"}>
                      {scanResult.details.contractVerified ? "✓ Yes" : "✗ No"}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded">
                    <span>Liquidity Locked:</span>
                    <span className={scanResult.details.liquidityLocked ? "text-green-600" : "text-red-600"}>
                      {scanResult.details.liquidityLocked ? "✓ Yes" : "✗ No"}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded">
                    <span>Ownership Renounced:</span>
                    <span className={scanResult.details.ownershipRenounced ? "text-green-600" : "text-red-600"}>
                      {scanResult.details.ownershipRenounced ? "✓ Yes" : "✗ No"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {scanResult.type === "website" && scanResult.details.phishingAnalysis && (
              <div className="space-y-4">
                <h4 className="font-semibold">Website Security Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded">
                    <span className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      SSL Certificate:
                    </span>
                    <span className={scanResult.details.sslValid ? "text-green-600" : "text-red-600"}>
                      {scanResult.details.sslValid ? "✓ Valid" : "✗ Invalid"}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded">
                    <span>Domain Age:</span>
                    <span>{scanResult.details.domainAge} days</span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded">
                    <span>Risk Score:</span>
                    <span
                      className={
                        scanResult.details.riskScore! > 70
                          ? "text-red-600"
                          : scanResult.details.riskScore! > 40
                            ? "text-orange-600"
                            : "text-green-600"
                      }
                    >
                      {scanResult.details.riskScore}/100
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded">
                    <span>Phishing Match:</span>
                    <span className={scanResult.details.phishingMatch ? "text-red-600" : "text-green-600"}>
                      {scanResult.details.phishingMatch ? "✗ Yes" : "✓ No"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Security Recommendation */}
            <Alert className={scanResult.status === "danger" ? "border-red-200 bg-red-50" : ""}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Security Recommendation:</strong>{" "}
                {scanResult.status === "safe"
                  ? scanResult.type === "token"
                    ? "This appears to be a legitimate project. However, always conduct your own research before making any transactions or investments."
                    : "This website appears to be safe. However, always verify URLs carefully and never enter sensitive information unless you're certain of the site's authenticity."
                  : scanResult.status === "caution"
                    ? scanResult.type === "token"
                      ? "Exercise caution with this project. Some risk factors have been identified that require careful consideration before proceeding."
                      : "Exercise caution with this website. Some security concerns have been identified. Verify the URL and avoid entering sensitive information."
                    : scanResult.type === "token"
                      ? "⚠️ HIGH RISK DETECTED! This may be a scam, phishing attempt, or malicious contract. We strongly recommend avoiding any interaction with this address."
                      : "⚠️ HIGH RISK DETECTED! This appears to be a phishing site or malicious website. Do not enter any personal information or connect your wallet."}
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
