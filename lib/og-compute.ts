import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
import { ethers } from 'ethers';

export interface AIAnalysisResult {
  riskScore: number;
  confidence: number;
  findings: string[];
  summary: string;
}

type ServingBroker = Awaited<ReturnType<typeof createZGComputeNetworkBroker>>;

class OgComputeService {
  private servingBroker: ServingBroker | null = null;
  private initializationPromise: Promise<void>;

  constructor() {
    this.initializationPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    const privateKey = process.env.OG_PRIVATE_KEY;
    const rpcUrl = process.env.OG_CHAIN_RPC_URL || "https://evmrpc-testnet.0g.ai";

    if (!privateKey) {
      console.warn("OG_PRIVATE_KEY is not set in .env.local. 0G Compute features will be disabled.");
      return;
    }

    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(privateKey, provider);
      this.servingBroker = await createZGComputeNetworkBroker(wallet);
      console.log("✅ 0G Compute Service initialized successfully.");
    } catch (error) {
      console.error("Failed to initialize 0G Compute Service:", error);
      this.servingBroker = null;
    }
  }

  private getModelForType(type: string): string {
    const modelMap: { [key: string]: string } = {
      // You can replace these with fine-tuned model names for each task.
      // The model name below is from the 0G Compute SDK documentation.
      token_analysis: "succinct-community/gemma-2b-it:free",
      phishing_detection: "succinct-community/gemma-2b-it:free",
      pattern_recognition: "succinct-community/gemma-2b-it:free",
    };
    return modelMap[type] || "succinct-community/gemma-2b-it:free";
  }

  async analyzeTokenSecurity(tokenData: any): Promise<AIAnalysisResult | null> {
    await this.initializationPromise;

    if (!this.servingBroker) {
      console.warn("0G Compute Service is not available. Skipping AI analysis.");
      return null;
    }

    try {
      const model = this.getModelForType("token_analysis");
      // The AI model expects a clear, structured prompt. We create one here.
      const input = `Analyze the following smart contract data for security risks. Provide a risk score (0-100), confidence level (0-100), a list of findings, and a brief summary. Data: ${JSON.stringify(tokenData, null, 2)}`;

      console.log(`Submitting analysis job to 0G Compute with model: ${model}`);
      const { taskId, promise } = await this.servingBroker.run(model, input);
      console.log(`✅ AI analysis task submitted with ID: ${taskId}`);

      const result = await promise;
      console.log(`✅ AI analysis task ${taskId} completed.`);

      // The SDK result is often a string. We need to parse it into our structured format.
      return this.parseAIResult(result);
    } catch (error) {
      console.error("AI analysis with 0G Compute SDK failed:", error);
      // Return null so the app can continue without AI data.
      return null;
    }
  }

  private parseAIResult(rawResult: string): AIAnalysisResult {
    console.log("Raw AI Result:", rawResult);
    // Attempt to parse a JSON block from the model's response
    const jsonMatch = rawResult.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          riskScore: parsed.riskScore || 50,
          confidence: parsed.confidence || 50,
          findings: parsed.findings || [],
          summary: parsed.summary || 'AI analysis completed.',
        };
      } catch (e) {
        console.error("Failed to parse JSON from AI result, falling back to text parsing.", e);
      }
    }

    // Fallback for non-JSON or malformed JSON responses
    const riskScoreMatch = rawResult.match(/Risk Score: (\d+)/i);
    const confidenceMatch = rawResult.match(/Confidence: (\d+)/i);
    
    return {
      riskScore: riskScoreMatch ? parseInt(riskScoreMatch[1], 10) : 50,
      confidence: confidenceMatch ? parseInt(confidenceMatch[1], 10) : 50,
      findings: [rawResult.substring(0, 250)], // Truncate for display
      summary: rawResult.substring(0, 500),
    };
  }
}

export const ogCompute = new OgComputeService()
