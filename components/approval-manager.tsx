'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, ShieldAlert, PlusCircle, Server, Wallet } from 'lucide-react'
import Image from 'next/image'
import { useAuth } from '@/context/auth-context'
import { useToast } from '@/hooks/use-toast'

// Mock data for adding a new DApp for testing
const newMockConnection = {
  dapp: 'PancakeSwap',
  logo: 'https://cdn.worldvectorlogo.com/logos/pancakeswap-cake.svg',
  category: 'DEX',
  approvedOn: new Date().toISOString(),
  riskLevel: 'medium',
}

interface DAppConnection {
  dapp: string;
  logo: string;
  category: string;
  approvedOn: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export function ApprovalManager() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [connections, setConnections] = useState<DAppConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const walletAddress = user?.walletAddress;

  const fetchConnections = useCallback(async () => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/dapp-approvals?walletAddress=${walletAddress}`)
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to fetch approvals.');
      }
      const data = await response.json();
      setConnections(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.'
      setError(errorMessage)
      toast({ variant: "destructive", title: "Error", description: errorMessage })
    } finally {
      setLoading(false)
    }
  }, [walletAddress, toast]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleAddConnection = async () => {
    if (!walletAddress) {
      toast({ variant: "destructive", title: "Error", description: "Wallet not connected." })
      return
    }

    setIsSaving(true)
    try {
      // Get the latest list before adding to it
      const response = await fetch(`/api/dapp-approvals?walletAddress=${walletAddress}`);
      const currentConnections = await response.json();
      const updatedConnections = [...currentConnections, newMockConnection];
      
      const postResponse = await fetch('/api/dapp-approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, connections: updatedConnections }),
      });

      if (!postResponse.ok) {
        const errorData = await postResponse.json();
        throw new Error(errorData.details || 'Failed to save data.');
      }
      
      const { txHash } = await postResponse.json();
      
      setConnections(updatedConnections); // Optimistically update UI
      toast({
        title: "Success",
        description: `New DApp connection saved to 0G Storage. Tx: ${txHash.substring(0, 10)}...`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save data.'
      setError(errorMessage)
      toast({ variant: "destructive", title: "Save Failed", description: errorMessage })
    } finally {
      setIsSaving(false)
    }
  }

  if (!walletAddress) {
    return (
      <Alert>
        <Wallet className="h-4 w-4" />
        <AlertTitle>Wallet Not Connected</AlertTitle>
        <AlertDescription>Please connect your wallet to manage DApp approvals.</AlertDescription>
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
        <AlertTitle>Error Fetching Data</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>DApp Approvals</CardTitle>
          <CardDescription>
            Showing active connections for: <span className="font-mono text-sm">{walletAddress}</span>
          </CardDescription>
        </div>
        <Button onClick={handleAddConnection} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
          {isSaving ? 'Saving...' : 'Add Test Approval'}
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>DApp</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead>Approved On</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {connections.length > 0 ? (
              connections.map((conn) => (
                <TableRow key={conn.dapp}>
                  <TableCell className="flex items-center gap-2 font-medium">
                    <Image src={conn.logo} alt={conn.dapp} width={24} height={24} className="rounded-full bg-white" />
                    {conn.dapp}
                  </TableCell>
                  <TableCell>{conn.category}</TableCell>
                  <TableCell className={`capitalize font-semibold ${
                    conn.riskLevel === 'high' ? 'text-red-600' :
                    conn.riskLevel === 'medium' ? 'text-orange-600' :
                    'text-green-600'
                  }`}>{conn.riskLevel}</TableCell>
                  <TableCell>{new Date(conn.approvedOn).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  <Server className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                  No DApp approval data found on 0G Storage for this wallet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
