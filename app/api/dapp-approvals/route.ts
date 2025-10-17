import { NextResponse } from "next/server";
import { ethers } from 'ethers';
import { Indexer, KvClient } from '@0glabs/0g-ts-sdk';

// Securely initialize the SDK on the server side
const RPC_URL = process.env.OG_RPC_URL!;
const INDEXER_RPC = process.env.INDEXER_RPC!;
const privateKey = process.env.PRIVATE_KEY!;

let indexer: Indexer;
let signer: ethers.Wallet;

// Initialize SDK clients in a shared scope
if (RPC_URL && INDEXER_RPC && privateKey) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  signer = new ethers.Wallet(privateKey, provider);
  indexer = new Indexer(INDEXER_RPC);
} else {
  // Log the error but don't throw, so the server can start
  console.error("Critical Error: Missing 0G environment variables for Storage SDK. The API will not function.");
}

const DAPP_APPROVAL_STREAM_ID = "0gsecura-dapp-approvals-v1";

/**
 * GET handler to retrieve DApp connections for a wallet.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('walletAddress');

  if (!walletAddress) {
    return NextResponse.json({ error: "Missing walletAddress query parameter" }, { status: 400 });
  }
  if (!indexer) {
    return NextResponse.json({ error: "Storage service is not initialized on the server" }, { status: 500 });
  }

  try {
    const nodes = await indexer.selectNodes();
    const streamIdBytes = ethers.encodeBytes32String(DAPP_APPROVAL_STREAM_ID);
    const kvClient = new KvClient(streamIdBytes, nodes);
    const keyBytes = ethers.toUtf8Bytes(walletAddress);

    // Correctly handle the promise: it returns the value directly or throws on error.
    const value = await kvClient.getValue(keyBytes);

    if (!value || value.length === 0) {
      return NextResponse.json([]); // No data found, return empty array
    }

    const jsonString = ethers.toUtf8String(value);
    const data = JSON.parse(jsonString);
    return NextResponse.json(data);
  } catch (error: any) {
    // If getValue throws, it's likely the key doesn't exist. This is not a server error.
    if (error.message && error.message.includes("Value not found")) {
      return NextResponse.json([]);
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Failed to retrieve data from 0G Storage", details: errorMessage }, { status: 500 });
  }
}

/**
 * POST handler to save DApp connections for a wallet.
 */
export async function POST(request: Request) {
  const { walletAddress, connections } = await request.json();

  if (!walletAddress || !connections) {
    return NextResponse.json({ error: "Missing walletAddress or connections in request body" }, { status: 400 });
  }
  if (!indexer || !signer) {
    return NextResponse.json({ error: "Storage service is not initialized on the server" }, { status: 500 });
  }

  try {
    const nodes = await indexer.selectNodes();
    const streamIdBytes = ethers.encodeBytes32String(DAPP_APPROVAL_STREAM_ID);
    
    // KvClient is used for both reads and writes.
    const kvClient = new KvClient(streamIdBytes, nodes, signer, RPC_URL);

    const key = ethers.toUtf8Bytes(walletAddress);
    const value = ethers.toUtf8Bytes(JSON.stringify(connections));

    // The correct method to write data is `putValue`.
    const txHash = await kvClient.putValue(key, value);

    return NextResponse.json({ success: true, txHash });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Failed to save data to 0G Storage", details: errorMessage }, { status: 500 });
  }
}