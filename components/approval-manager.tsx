'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, ShieldAlert, ShieldX, Wallet } from 'lucide-react'
import Image from 'next/image'

// In a real application, this hook would be part of a larger wallet context (using Zustand, React Context, etc.)
// that is initialized when a user connects their wallet.
const useWallet = () => {
  return {
    address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', // Using a static address for demonstration
    isConnected: true,
    // This function would return a real signer object from a library like ethers.js or viem
    getSigner: async () => {
      alert("This is a demo. A real wallet connection is required to sign and send a transaction.")
      return null
    },
  }
}

interface Approval {
  token: { address: string; name: string; symbol: string; logo: string }
  spender: { address: string; name: string }
  allowance: string
}

export function ApprovalManager() {
  const { address, isConnected, getSigner } = useWallet()
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isConnected && address) {
      setLoading(true)
      fetch(`/api/approvals?address=${address}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setApprovals(data.approvals)
          } else {
            setError(data.error || 'Failed to fetch approvals.')
          }
        })
        .catch(() => setError('An unexpected error occurred while fetching data.'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [address, isConnected])

  const handleRevoke = async (tokenAddress: string, spenderAddress: string) => {
    alert(`This would trigger a transaction to revoke approval for token ${tokenAddress} from spender ${spenderAddress}.`)
    // Example of a real implementation with ethers.js:
    // const signer = await getSigner();
    // if (!signer) return;
    // const erc20Abi = ["function approve(address spender, uint256 amount) public returns (bool)"];
    // const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signer);
    // try {
    //   const tx = await tokenContract.approve(spenderAddress, 0);
    //   await tx.wait();
    //   // Optionally, re-fetch approvals here to update the UI
    // } catch (e) {
    //   console.error("Revoke failed:", e);
    //   alert("Transaction failed or was rejected.");
    // }
  }

  if (!isConnected) {
    return (
      <Alert>
        <Wallet className="h-4 w-4" />
        <AlertTitle>Wallet Not Connected</AlertTitle>
        <AlertDescription>Please connect your wallet to view and manage your token approvals.</AlertDescription>
      </Alert>
    )
  }

  if (loading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Token Approvals</CardTitle>
        <CardDescription>Showing approvals for wallet: <span className="font-mono text-sm">{address}</span></CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead>Spender</TableHead>
              <TableHead>Allowance</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {approvals.map((approval) => (
              <TableRow key={`${approval.token.address}-${approval.spender.address}`}>
                <TableCell className="flex items-center gap-2 font-medium">
                  <Image src={approval.token.logo} alt={approval.token.name} width={24} height={24} className="rounded-full" />
                  {approval.token.name} ({approval.token.symbol})
                </TableCell>
                <TableCell><span className="font-mono text-xs">{approval.spender.name}</span></TableCell>
                <TableCell>{approval.allowance.length > 30 ? 'Unlimited' : 'Limited'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="destructive" size="sm" onClick={() => handleRevoke(approval.token.address, approval.spender.address)}>
                    <ShieldX className="mr-2 h-4 w-4" /> Revoke
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}