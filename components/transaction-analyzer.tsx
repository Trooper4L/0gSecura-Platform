"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { analyzeTransaction } from "@/lib/0g/compute-service"
import { Loader2, AlertTriangle, CheckCircle, Info } from "lucide-react"

interface AnalysisResult {
  summary: string
  riskLevel: "low" | "medium" | "high"
  riskFactors: string[]
  involvedAddresses: {
    from: string
    to: string
    contracts: string[]
  }
  recommendation: string
}

export function TransactionAnalyzer() {
  const [txHash, setTxHash] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!txHash.trim()) {
      setError("Please enter a valid transaction hash.")
      return
    }

    setIsLoading(true)
    setAnalysis(null)
    setError(null)

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "transaction",
          value: txHash.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || "Failed to analyze transaction")
      }

      const result = await response.json()
      setAnalysis(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const getRiskColor = (riskLevel: "low" | "medium" | "high") => {
    switch (riskLevel) {
      case "low":
        return "text-green-600"
      case "medium":
        return "text-orange-600"
      case "high":
        return "text-red-600"
      default:
        return "text-slate-600"
    }
  }

  const getRiskIcon = (riskLevel: "low" | "medium" | "high") => {
    switch (riskLevel) {
      case "low":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "medium":
        return <AlertTriangle className="h-5 w-5 text-orange-600" />
      case "high":
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <Info className="h-5 w-5 text-slate-600" />
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Transaction Analyzer</CardTitle>
        <CardDescription>Enter a transaction hash to analyze its security and risk profile.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="0x..."
            value={txHash}
            onChange={(e) => {
              setTxHash(e.target.value)
              setError(null)
            }}
            className="font-mono"
          />
          <Button onClick={handleAnalyze} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isLoading ? "Analyzing..." : "Analyze"}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {analysis && (
          <div className="space-y-4 pt-4">
            <Alert className={
              analysis.riskLevel === "high" ? "border-red-500/50" :
              analysis.riskLevel === "medium" ? "border-orange-500/50" :
              "border-green-500/50"
            }>
              <div className="flex items-center gap-3">
                {getRiskIcon(analysis.riskLevel)}
                <div>
                  <AlertTitle className={`font-bold ${getRiskColor(analysis.riskLevel)}`}>
                    Risk Level: {analysis.riskLevel.toUpperCase()}
                  </AlertTitle>
                  <AlertDescription>{analysis.recommendation}</AlertDescription>
                </div>
              </div>
            </Alert>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Summary</h4>
              <p className="text-sm text-slate-700 dark:text-slate-300">{analysis.summary}</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Risk Factors</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {analysis.riskFactors.map((factor, index) => (
                  <li key={index}>{factor}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Involved Addresses</h4>
              <div className="text-sm font-mono bg-slate-100 dark:bg-slate-800 p-3 rounded">
                <p><strong>From:</strong> {analysis.involvedAddresses.from}</p>
                <p><strong>To:</strong> {analysis.involvedAddresses.to}</p>
                {analysis.involvedAddresses.contracts.length > 0 && (
                  <p><strong>Contracts:</strong> {analysis.involvedAddresses.contracts.join(", ")}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}