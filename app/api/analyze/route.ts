import { NextResponse } from "next/server"
import { ethers } from "ethers"
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker"

// Initialize the broker on the server side
const RPC_URL = process.env.OG_RPC_URL!
const privateKey = process.env.PRIVATE_KEY! // Using the correct private key from your .env.local

if (!RPC_URL || !privateKey) {
  console.error("Missing 0G environment variables in .env.local")
}

const provider = new ethers.JsonRpcProvider(RPC_URL)
const wallet = new ethers.Wallet(privateKey, provider)

let broker: any

const initializeBroker = async () => {
  if (!broker) {
    // Check wallet balance before proceeding
    const balance = await provider.getBalance(wallet.address)
    if (balance === 0n) {
      console.error(`Funding required: The wallet ${wallet.address} has zero balance. Please fund it using the 0G Galileo Testnet faucet.`)
      throw new Error(`The server wallet ${wallet.address} has no funds. Please add funds via the 0G Testnet faucet to pay for gas fees.`)
    }
    broker = await createZGComputeNetworkBroker(wallet)
  }
  return broker
}

const DEEPSEEK_PROVIDER_ADDRESS = "0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3"

async function performInference(prompt: string) {
  const broker = await initializeBroker()
  const providerAddress = DEEPSEEK_PROVIDER_ADDRESS

  await broker.inference.acknowledgeProviderSigner(providerAddress)

  const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress)
  const messages = [{ role: "user", content: prompt }]
  const headers = await broker.inference.getRequestHeaders(providerAddress, JSON.stringify(messages))

  const response = await fetch(`${endpoint}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({
      messages,
      model,
      response_format: { type: "json_object" },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get response from 0G service: ${errorText}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content
  return JSON.parse(content)
}

export async function POST(request: Request) {
  try {
    const { type, value } = await request.json()
    let prompt = ""

    if (!type || !value) {
      return NextResponse.json({ error: "Missing 'type' or 'value' in request body" }, { status: 400 })
    }

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
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in analysis API route:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 })
  }
}