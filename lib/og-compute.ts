import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export interface AIAnalysisResult {
  riskScore: number;
  confidence: number;
  findings: string[];
  summary: string;
}

class AiAnalysisService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    } else {
      console.warn("GEMINI_API_KEY is not set. AI analysis features will be disabled.");
    }
  }

  private generatePrompt(tokenData: any): string {
    return `
      Analyze the following blockchain token data for security risks and scam potential.
      Provide your analysis in a JSON object with the following structure:
      {
        "riskScore": number, // A score from 0 (safe) to 100 (high risk)
        "confidence": number, // Your confidence in the risk score, from 0 to 100
        "summary": string, // A one-sentence summary of the findings
        "findings": string[] // A list of specific findings (e.g., "Contract owner can mint new tokens", "High percentage of tokens held by a single address")
      }

      Token Data:
      ${JSON.stringify(tokenData, null, 2)}
    `;
  }

  async analyzeTokenSecurity(tokenData: any): Promise<AIAnalysisResult | null> {
    if (!this.genAI) {
      console.error("AI Analysis Service is not initialized. Check GEMINI_API_KEY.");
      return null;
    }

    try {
      const prompt = this.generatePrompt(tokenData);

      const generationConfig = {
        temperature: 0.2,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      };

      const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ];

      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
        safetySettings,
      });

      const response = result.response;
      const jsonText = response.text();
      const analysis: AIAnalysisResult = JSON.parse(jsonText);
      
      console.log("✅ AI analysis successful:", analysis);
      return analysis;

    } catch (error) {
      console.error("AI analysis with Gemini failed:", error);
      return null;
    }
  }
}

export const ogCompute = new AiAnalysisService()
