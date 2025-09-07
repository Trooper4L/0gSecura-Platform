'use client'

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { db } from "@/lib/firebase"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Shield } from "lucide-react"
import Link from "next/link"

export default function ThreatIntelPage() {
  const { user } = useAuth()
  const [address, setAddress] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError("You must be logged in to submit a report.")
      return
    }
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await addDoc(collection(db, "reports"), {
        reportedItem: address,
        reason: reason,
        reporterUid: user.uid,
        reporterEmail: user.email,
        createdAt: serverTimestamp(),
        status: 'pending',
      })
      setSuccess(true)
      setAddress('')
      setReason('')
    } catch (err) {
      console.error(err)
      setError("Failed to submit report. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-950/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">0gSecura</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Community Threat Intel</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Report a Threat</CardTitle>
                <CardDescription>Help protect the community by reporting suspicious addresses or websites.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!user && (
                  <Alert>
                    <AlertTitle>Authentication Required</AlertTitle>
                    <AlertDescription>
                      Please <Link href="/login" className="underline">log in</Link> to submit a report.
                    </AlertDescription>
                  </Alert>
                )}
                {success && <Alert variant="default"><AlertTitle>Success!</AlertTitle><AlertDescription>Your report has been submitted. Thank you!</AlertDescription></Alert>}
                {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                <div className="space-y-2">
                  <Label htmlFor="address">Suspicious Address/URL</Label>
                  <Input id="address" placeholder="0x... or https://..." value={address} onChange={e => setAddress(e.target.value)} disabled={!user || loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Report</Label>
                  <Textarea id="reason" placeholder="Describe why this is suspicious..." value={reason} onChange={e => setReason(e.target.value)} disabled={!user || loading} />
                </div>
                <Button type="submit" className="w-full" disabled={!user || loading || !address || !reason}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Report
                </Button>
              </CardContent>
            </form>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Community Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reported Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{/* Rows with reported data would go here */}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}