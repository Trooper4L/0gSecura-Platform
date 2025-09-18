'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { AppLogo } from "@/components/app-logo"
import { ArrowLeft, Bot, Loader2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getAI, getGenerativeModel } from "@firebase/ai"
import { useAuth } from "@/context/auth-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SimulatorPage() {
  const router = useRouter()
  const { app } = useAuth()
  const [txData, setTxData] = useState("")
  const [simulationResult, setSimulationResult] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSimulate = async () => {
    if (!app || !txData) return
    setIsLoading(true)
    setError(null)
    setSimulationResult("")

    try {
      const ai = getAI(app)
      const model = getGenerativeModel(ai, { model: "gemini-pro" })
      const prompt = `Analyze the following raw Ethereum transaction data. Provide a human-readable summary of what will happen if a user signs it. Focus on security implications. Explain the actions, asset movements, and permissions granted. Highlight any potential risks like wallet draining, unexpected fees, or malicious contract interactions. Format the output as clear, concise markdown. If there are high-severity risks, start with a clear warning. Transaction data: ${txData}`
      const result = await model.generateContent(prompt)
      setSimulationResult(result.response.text())
    } catch (e) {
      console.error("Simulation Error:", e)
      setError("Failed to simulate transaction. The AI model may be unavailable or the data is invalid.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-950/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-lg">
                <AppLogo />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">0gSecura</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Transaction Simulator</p>
              </div>
            </Link>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-slate-900 dark:text-slate-100 mb-4">
            See Before You Sign
          </h2>
          <p className="text-lg text-center text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-12">
            Paste raw transaction data to get a human-readable summary of what will happen if you sign it. Avoid wallet drainers and unexpected fees.
          </p>

          <Card>
            <CardHeader>
              <CardTitle>New Simulation</CardTitle>
              <CardDescription>Enter the raw transaction data in hex format below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="0x..."
                className="min-h-[150px] font-mono"
                value={txData}
                onChange={e => setTxData(e.target.value)}
                disabled={isLoading}
              />
              <Button size="lg" className="w-full" onClick={handleSimulate} disabled={isLoading || !txData}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Simulating...
                  </>
                ) : (
                  "Simulate Transaction"
                )}
              </Button>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive" className="mt-8">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Simulation Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {simulationResult && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-blue-500" /> AI Simulation Result</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: simulationResult.replace(/\n/g, '<br />') }} />
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}