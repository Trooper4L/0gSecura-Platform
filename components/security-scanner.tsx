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
import { useAuth } from "@/context/auth-context"

interface ScanResult {
  type: "token" | "website";
  address: string;
  trustScore: number;
  status: "safe" | "caution" | "danger";
  flags: string[];
  details: any;
}

export function SecurityScanner() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("token");
  const [scanInput, setScanInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const { toast } = useToast();

  const handleScan = async () => {
    if (!user?.walletAddress) {
      toast({ variant: "destructive", title: "Authentication Error", description: "Please connect your wallet to perform a scan." });
      return;
    }

    setIsScanning(true);
    setScanResult(null);
    setError(null);
    setScanProgress(0);

    try {
      const progressInterval = setInterval(() => setScanProgress(prev => Math.min(prev + 10, 90)), 200);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            type: activeTab === "token" ? "contract" : "website", 
            value: scanInput.trim(),
            walletAddress: user.walletAddress 
        }),
      });

      clearInterval(progressInterval);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Failed to analyze");
      }

      const result = await response.json();
      setScanResult(result);
      setScanProgress(100);
      
      toast({ title: "Scan Complete", description: "Security analysis finished and saved to your history." });

    } catch (err: any) {
      setError(err.message);
      toast({ title: "Scan Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsScanning(false);
    }
  };
  
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Address copied to clipboard" });
  };
  
  const getStatusColor = (status: string) => {
    if (status === 'safe') return 'text-green-600';
    if (status === 'caution') return 'text-orange-600';
    if (status === 'danger') return 'text-red-600';
    return 'text-slate-600';
  }

  const getStatusIcon = (status: string) => {
    if (status === 'safe') return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (status === 'caution') return <AlertTriangle className="w-5 h-5 text-orange-600" />;
    if (status === 'danger') return <AlertTriangle className="w-5 h-5 text-red-600" />;
    return <Shield className="w-5 h-5 text-slate-600" />;
  }

  return (
        <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Security Scanner</CardTitle>
        <CardDescription>Analyze tokens and websites for threats.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="token">Token/Contract</TabsTrigger>
            <TabsTrigger value="website">Website/URL</TabsTrigger>
          </TabsList>
          <TabsContent value="token">
             <Input placeholder="0x..." value={scanInput} onChange={(e) => setScanInput(e.target.value)} />
          </TabsContent>
          <TabsContent value="website">
             <Input placeholder="https://..." value={scanInput} onChange={(e) => setScanInput(e.target.value)} />
          </TabsContent>
        </Tabs>
        <Button onClick={handleScan} disabled={isScanning} className="w-full mt-4">
          {isScanning ? "Scanning..." : "Scan"}
        </Button>
        {isScanning && <Progress value={scanProgress} className="mt-4" />}
        {error && <Alert variant="destructive" className="mt-4"><AlertDescription>{error}</AlertDescription></Alert>}
        {scanResult && (
          <div className="mt-6 space-y-6">
            {/* Result rendering logic */}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

