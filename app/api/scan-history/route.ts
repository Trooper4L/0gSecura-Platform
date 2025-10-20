import { NextResponse } from "next/server";
import { ethers } from 'ethers';
import { Indexer, KvClient } from '@0glabs/0g-ts-sdk';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs for each scan

// --- Securely initialize the SDK on the server side ---
const RPC_URL = process.env.OG_RPC_URL!;
const INDEXER_RPC = process.env.INDEXER_RPC!;
const privateKey = process.env.PRIVATE_KEY!;

let indexer: Indexer;
let signer: ethers.Wallet;

if (RPC_URL && INDEXER_RPC && privateKey) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  signer = new ethers.Wallet(privateKey, provider);
  indexer = new Indexer(INDEXER_RPC);
} else {
  console.error("Critical Error: Missing 0G environment variables for Storage SDK.");
}

const SCAN_HISTORY_STREAM_ID = "0gsecura-scan-history-v2"; // Unique ID for this data stream

// Helper function to get the KV client
async function getKvClient(forWrite: boolean = false) {
  if (!indexer) throw new Error("Storage service is not initialized on the server");
  const nodes = await indexer.selectNodes();
  const streamIdBytes = ethers.encodeBytes32String(SCAN_HISTORY_STREAM_ID);
  
  if (forWrite) {
    if (!signer) throw new Error("Signer is not initialized for write operations");
    return new KvClient(streamIdBytes, nodes, signer, RPC_URL);
  }
  return new KvClient(streamIdBytes, nodes);
}

/**
 * GET handler: Retrieves scan history for a given wallet address.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('walletAddress');

  if (!walletAddress) {
    return NextResponse.json({ error: "Missing walletAddress query parameter" }, { status: 400 });
  }

  try {
    const kvClient = await getKvClient();
    const keyBytes = ethers.toUtf8Bytes(walletAddress);
    const value = await kvClient.getValue(keyBytes);

    if (!value || value.length === 0) {
      return NextResponse.json({ data: { scans: [], pagination: { hasMore: false }, userStats: {} } });
    }

    const jsonString = ethers.toUtf8String(value);
    const scans = JSON.parse(jsonString);

    // Basic stats calculation on the server
    const userStats = {
      totalScans: scans.length,
      safeScans: scans.filter((s: any) => s.result.status === 'safe').length,
      dangerScans: scans.filter((s: any) => s.result.status === 'danger').length,
      cautionScans: scans.filter((s: any) => s.result.status === 'caution').length,
    };

    return NextResponse.json({ data: { scans, pagination: { hasMore: false }, userStats } });
  } catch (error: any) {
    if (error.message && error.message.includes("Value not found")) {
      return NextResponse.json({ data: { scans: [], pagination: { hasMore: false }, userStats: {} } });
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Failed to retrieve scan history", details: errorMessage }, { status: 500 });
  }
}

/**
 * POST handler: Adds a new scan result to a user's history.
 */
export async function POST(request: Request) {
  const { walletAddress, scanResult } = await request.json();

  if (!walletAddress || !scanResult) {
    return NextResponse.json({ error: "Missing walletAddress or scanResult" }, { status: 400 });
  }

  try {
    const kvClient = await getKvClient(true);
    const keyBytes = ethers.toUtf8Bytes(walletAddress);
    
    let currentHistory = [];
    try {
      const value = await kvClient.getValue(keyBytes);
      if (value && value.length > 0) {
        currentHistory = JSON.parse(ethers.toUtf8String(value));
      }
    } catch (e) { /* Key doesn't exist, which is fine */ }

    const newScan = {
      ...scanResult,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
    };
    const updatedHistory = [newScan, ...currentHistory];

    const valueBytes = ethers.toUtf8Bytes(JSON.stringify(updatedHistory));
    const txHash = await kvClient.putValue(keyBytes, valueBytes, { gasPrice: BigInt(10_000_000_000) });

    return NextResponse.json({ success: true, txHash });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Failed to save scan history", details: errorMessage }, { status: 500 });
  }
}

/**
 * DELETE handler: Removes a scan from a user's history.
 */
export async function DELETE(request: Request) {
    const { walletAddress, scanId } = await request.json();

    if (!walletAddress || !scanId) {
        return NextResponse.json({ error: "Missing walletAddress or scanId" }, { status: 400 });
    }

    try {
        const kvClient = await getKvClient(true);
        const keyBytes = ethers.toUtf8Bytes(walletAddress);

        let currentHistory = [];
        const value = await kvClient.getValue(keyBytes);
        if (value && value.length > 0) {
            currentHistory = JSON.parse(ethers.toUtf8String(value));
        } else {
            return NextResponse.json({ error: "No history found for this user" }, { status: 404 });
        }

        const updatedHistory = currentHistory.filter((scan: any) => scan.id !== scanId);

        const valueBytes = ethers.toUtf8Bytes(JSON.stringify(updatedHistory));
        const txHash = await kvClient.putValue(keyBytes, valueBytes, { gasPrice: BigInt(10_000_000_000) });

        return NextResponse.json({ success: true, txHash });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: "Failed to delete scan", details: errorMessage }, { status: 500 });
    }
}

