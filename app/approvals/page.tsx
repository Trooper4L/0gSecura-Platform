import { ApprovalManager } from "@/components/approval-manager"
import { Shield } from "lucide-react"
import Link from "next/link"

export default function ApprovalsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-950/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-purple-600 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">0gSecura</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">DApp Approval Manager</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Manage Your Token Approvals
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
            Review which DApps can access your tokens and revoke any suspicious or unused permissions to enhance your wallet's security.
          </p>
        </div>

        <ApprovalManager />
      </main>
    </div>
  )
}