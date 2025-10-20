import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { OGSECURA_AUTH_CONTRACT } from "@/lib/wallet-auth";

const RPC_URL = process.env.OG_RPC_URL!;
const privateKey = process.env.PRIVATE_KEY!;

let provider: ethers.JsonRpcProvider;
let contract: ethers.Contract;

if (RPC_URL && privateKey && OGSECURA_AUTH_CONTRACT.address) {
  provider = new ethers.JsonRpcProvider(RPC_URL);
  // Connect to the contract with a server-side signer for read/write operations
  const signer = new ethers.Wallet(privateKey, provider);
  contract = new ethers.Contract(OGSECURA_AUTH_CONTRACT.address, OGSECURA_AUTH_CONTRACT.abi, signer);
} else {
  console.error("Missing server-side auth environment variables.");
}

export async function POST(request: Request) {
  const { address, signature, message } = await request.json();

  if (!address || !signature || !message) {
    return NextResponse.json({ error: "Missing address, signature, or message" }, { status: 400 });
  }

  try {
    // 1. Verify the signature to prove wallet ownership
    const recoveredAddress = ethers.verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 2. Check if the user is registered on the smart contract
    const profile = await contract.getUserProfile(address);
    const isRegistered = profile.isRegistered;

    // 3. (Optional but recommended) Generate a session token (e.g., JWT)
    // For this example, we'll just return the registration status.
    
    return NextResponse.json({ isAuthenticated: true, isRegistered });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Server-side verification failed", details: errorMessage }, { status: 500 });
  }
}