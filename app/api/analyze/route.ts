import { NextResponse } from "next/server"
import { ethers, FeeData } from "ethers"
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker"
import { Indexer, KvClient, Batcher, getFlowContract } from '@0glabs/0g-ts-sdk';
import { v4 as uuidv4 } from 'uuid';

// --- 1. The Correct, Clean Solution for Low Gas Fees ---
// We create a custom Ethers provider that overrides the default fee data.
class LowGasProvider extends ethers.JsonRpcProvider {
  async getFeeData(): Promise<FeeData> {
    const feeData = await super.getFeeData();
    // The feeData object is read-only. We must create a new one with our overridden gas price.
    return new FeeData(
      ethers.parseUnits('10', 'gwei'), // gasPrice
      feeData.maxFeePerGas,             // maxFeePerGas
      feeData.maxPriorityFeePerGas      // maxPriorityFeePerGas
    );
  }
}

// --- SDK Initialization ---
const RPC_URL = process.env.OG_RPC_URL!
const privateKey = process.env.PRIVATE_KEY!
const FLOW_CONTRACT_ADDRESS = "0x56A565685C9992BF5ACafb940ff68922980DBBC5";
if (!RPC_URL || !privateKey) {
  console.error("Missing 0G environment variables in .env.local")
}

// Use our custom provider to create the wallet
const provider = new LowGasProvider(RPC_URL)
const wallet = new ethers.Wallet(privateKey, provider)
let broker: any

const INDEXER_RPC = process.env.INDEXER_RPC!;
let indexer: Indexer;
if (INDEXER_RPC) {
  indexer = new Indexer(INDEXER_RPC);
}

const SCAN_HISTORY_STREAM_ID = "0gsecura-scan-history-v2";

async function getKvReadClient() {
    if (!INDEXER_RPC) throw new Error("Storage service is not initialized on the server");
    return new KvClient(INDEXER_RPC);
}

// --- 2. Self-Funding Ledger and Broker Initialization ---
const initializeBroker = async () => {
  if (broker) return broker;

  // Check native balance for gas fees
  const nativeBalance = await provider.getBalance(wallet.address)
  if (nativeBalance === 0n) {
    const errorMessage = `The server wallet ${wallet.address} has no native tokens for gas fees. Please fund it via the 0G Testnet faucet.`
    console.error(errorMessage)
    throw new Error(errorMessage)
  }

  // Create the broker instance
  broker = await createZGComputeNetworkBroker(wallet);

  // Check and top up the prepaid ledger for inference fees
  const account = await broker.ledger.getLedger();
  const minBalance = ethers.parseEther("1.0"); // Minimum balance of 1.0 0G token
  
  if (account.totalBalance < minBalance) {
    console.log(`Ledger balance is low (${ethers.formatEther(account.totalBalance)} 0G). Topping up with 5 0G...`);
    // This is an on-chain transaction that will use our low-gas provider
    await broker.ledger.addLedger(5); 
    console.log("Ledger top-up successful.");
  }
  
  return broker;
}

const DEEPSEEK_PROVIDER_ADDRESS = "0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3"

async function performInference(prompt: string) {
  const broker = await initializeBroker();
  const providerAddress = DEEPSEEK_PROVIDER_ADDRESS;

  // Acknowledge the provider. This is an on-chain transaction.
  // Our custom provider will automatically handle setting the low gas fee.
  await broker.inference.acknowledgeProviderSigner(providerAddress);

  const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress);
  const messages = [{ role: "user", content: prompt }];
  const headers = await broker.inference.getRequestHeaders(providerAddress, JSON.stringify(messages));

  const response = await fetch(`${endpoint}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({
      messages,
      model,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get response from 0G service: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  const parsedContent = JSON.parse(content);

  // Optional: Verify the response from verifiable services
  if (data.id) {
    const isValid = await broker.inference.processResponse(providerAddress, content, data.id);
    console.log("Response verification result:", isValid ? "Valid" : "Invalid");
  }

  return parsedContent;
}

async function saveScanToHistory(walletAddress: string, scanResult: any) {
    try {
        const kvClient = await getKvReadClient();
        const keyBytes = ethers.toUtf8Bytes(walletAddress);
        const streamIdBytes = ethers.encodeBytes32String(SCAN_HISTORY_STREAM_ID);

        let currentHistory = [];
        try {
            const value = await kvClient.getValue(streamIdBytes, keyBytes);
            if (value && value.data) {
                currentHistory = JSON.parse(Buffer.from(value.data, 'base64').toString('utf-8'));
            }
        } catch (e) { /* Key doesn't exist, which is fine */ }

        const newScan = {
            ...scanResult,
            id: uuidv4(),
            timestamp: new Date().toISOString(),
        };
        const updatedHistory = [newScan, ...currentHistory];

        const valueBytes = ethers.toUtf8Bytes(JSON.stringify(updatedHistory));

        const [nodes, err] = await indexer.selectNodes(1);
        if (err) {
            throw err;
        }

        // Type assertion needed due to ethers ESM/CommonJS module resolution conflict
        const flowContract = getFlowContract(FLOW_CONTRACT_ADDRESS, wallet as any);
        const batcher = new Batcher(1, nodes, flowContract, RPC_URL);
        batcher.streamDataBuilder.set(streamIdBytes, keyBytes, valueBytes);
        const [tx, errExec] = await batcher.exec();
        if (errExec) {
            throw errExec;
        }
        console.log("Scan history saved, tx:", tx);
    } catch (error) {
        console.error("Failed to save scan history:", error);
        // Don't block the main response, just log the error
    }
}

export async function POST(request: Request) {
  try {
    const { type, value, walletAddress } = await request.json()
    let prompt = ""

    if (!type || !value) {
      return NextResponse.json({ error: "Missing 'type' or 'value' in request body" }, { status: 400 })
    }


    // Prompts remain the same
    switch (type) {
      case "contract":
        prompt = `Analyze the smart contract at address "${value}". Provide a detailed security analysis and return a JSON object with the structure {"type": "token", "address": "${value}", "trustScore": number, "status": "safe" | "caution" | "danger", "flags": string[], "details": {"contractVerified": boolean, "liquidityLocked": boolean, "ownershipRenounced": boolean, "contractAnalysis": string, "transactionPatterns": string, "riskScore": number}}.`
        break
      case "website":
        prompt = `Analyze the website at URL "${value}". Provide a detailed security analysis for phishing and scams. Return a JSON object with the structure {"type": "website", "address": "${value}", "trustScore": number, "status": "safe" | "caution" | "danger", "flags": string[], "details": {"sslValid": boolean, "domainAge": number, "phishingMatch": boolean, "phishingAnalysis": string, "riskScore": number}}.`
        break
      case "transaction":
        prompt = `Analyze the blockchain transaction with the hash "${value}". Provide a detailed analysis of its purpose, risk, and legitimacy. Return a JSON object with the structure {"summary": string, "riskLevel": "low" | "medium" | "high", "riskFactors": string[], "involvedAddresses": {"from": string, "to": string, "contracts": string[]}, "recommendation": string}.`
        break
      default:
        return NextResponse.json({ error: "Invalid analysis type" }, { status: 400 })
    }

    const result = await performInference(prompt)

    if (walletAddress) {
        await saveScanToHistory(walletAddress, result);
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in analysis API route:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 })
  }
}