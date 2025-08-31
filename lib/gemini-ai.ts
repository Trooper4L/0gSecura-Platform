import { GoogleGenerativeAI } from '@google/generative-ai'

export interface SecurityAnalysisResult {
  riskScore: number
  confidence: number
  findings: string[]
  recommendations: string[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  summary: string
}

export interface ContractAnalysisInput {
  address: string
  tokenInfo: any
  contractAnalysis: any
  transactionPatterns: any
  liquidityAnalysis: any
  holderAnalysis: any
  honeypotAnalysis: any
}

export interface WebsiteAnalysisInput {
  url: string
  domainInfo: any
  sslAnalysis: any
  contentAnalysis: any
  phishingChecks: any
}

class GeminiSecurityAnalyzer {
  private genAI: GoogleGenerativeAI | null = null
  private model: any = null

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey)
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    } else {
      console.warn('Gemini API key not configured')
    }
  }

  /**
   * Analyze smart contract security using Gemini AI
   */
  async analyzeSmartContract(data: ContractAnalysisInput): Promise<SecurityAnalysisResult> {
    if (!this.model) {
      throw new Error('Gemini AI not configured')
    }

    try {
      const prompt = this.buildContractAnalysisPrompt(data)
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      return this.parseSecurityAnalysis(text)
    } catch (error) {
      console.error('Gemini contract analysis failed:', error)
      throw new Error('AI analysis failed')
    }
  }

  /**
   * Analyze website security using Gemini AI
   */
  async analyzeWebsite(data: WebsiteAnalysisInput): Promise<SecurityAnalysisResult> {
    if (!this.model) {
      throw new Error('Gemini AI not configured')
    }

    try {
      const prompt = this.buildWebsiteAnalysisPrompt(data)
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      return this.parseSecurityAnalysis(text)
    } catch (error) {
      console.error('Gemini website analysis failed:', error)
      throw new Error('AI analysis failed')
    }
  }

  /**
   * Build comprehensive prompt for smart contract analysis
   */
  private buildContractAnalysisPrompt(data: ContractAnalysisInput): string {
    return `
You are a blockchain security expert analyzing a smart contract on the 0G Network for potential security threats, scams, or malicious behavior.

SMART CONTRACT DATA:
Address: ${data.address}

TOKEN INFO:
${JSON.stringify(data.tokenInfo, null, 2)}

CONTRACT ANALYSIS:
${JSON.stringify(data.contractAnalysis, null, 2)}

TRANSACTION PATTERNS:
${JSON.stringify(data.transactionPatterns, null, 2)}

LIQUIDITY ANALYSIS:
${JSON.stringify(data.liquidityAnalysis, null, 2)}

HOLDER ANALYSIS:
${JSON.stringify(data.holderAnalysis, null, 2)}

HONEYPOT ANALYSIS:
${JSON.stringify(data.honeypotAnalysis, null, 2)}

ANALYSIS REQUIREMENTS:
1. Examine the contract for common scam patterns (honeypot, rug pull, fake tokens)
2. Analyze transaction patterns for suspicious activity
3. Check for proper ownership structures and security features
4. Evaluate liquidity and holder distributions for red flags
5. Consider the contract's interaction with 0G Network infrastructure

Provide your analysis in the following JSON format:
{
  "riskScore": <number 0-100, where 100 is maximum risk>,
  "confidence": <number 0-100, your confidence in this analysis>,
  "findings": [<array of specific security findings>],
  "recommendations": [<array of actionable recommendations>],
  "severity": "<low|medium|high|critical>",
  "summary": "<brief 2-3 sentence summary of the security assessment>"
}

Focus on practical security risks for 0G Network users. Be thorough but concise.
`
  }

  /**
   * Build comprehensive prompt for website analysis
   */
  private buildWebsiteAnalysisPrompt(data: WebsiteAnalysisInput): string {
    return `
You are a cybersecurity expert analyzing a website for phishing attempts, scams, or malicious content targeting cryptocurrency and 0G Network users.

WEBSITE DATA:
URL: ${data.url}

DOMAIN INFO:
${JSON.stringify(data.domainInfo, null, 2)}

SSL ANALYSIS:
${JSON.stringify(data.sslAnalysis, null, 2)}

CONTENT ANALYSIS:
${JSON.stringify(data.contentAnalysis, null, 2)}

PHISHING CHECKS:
${JSON.stringify(data.phishingChecks, null, 2)}

ANALYSIS REQUIREMENTS:
1. Check for phishing indicators (fake wallet connections, suspicious domains)
2. Analyze SSL certificate validity and trust indicators
3. Look for crypto/0G Network related scam patterns
4. Evaluate domain age, reputation, and hosting information
5. Check for malicious JavaScript or suspicious redirects

Provide your analysis in the following JSON format:
{
  "riskScore": <number 0-100, where 100 is maximum risk>,
  "confidence": <number 0-100, your confidence in this analysis>,
  "findings": [<array of specific security findings>],
  "recommendations": [<array of actionable recommendations>],
  "severity": "<low|medium|high|critical>",
  "summary": "<brief 2-3 sentence summary of the security assessment>"
}

Focus on protecting users from crypto-related phishing and scams. Be thorough but practical.
`
  }

  /**
   * Parse AI response into structured security analysis
   */
  private parseSecurityAnalysis(response: string): SecurityAnalysisResult {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])
      
      // Validate required fields
      return {
        riskScore: Math.max(0, Math.min(100, parsed.riskScore || 50)),
        confidence: Math.max(0, Math.min(100, parsed.confidence || 70)),
        findings: Array.isArray(parsed.findings) ? parsed.findings : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        severity: ['low', 'medium', 'high', 'critical'].includes(parsed.severity) 
          ? parsed.severity 
          : 'medium',
        summary: parsed.summary || 'AI analysis completed'
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error)
      
      // Fallback analysis
      return {
        riskScore: 50,
        confidence: 30,
        findings: ['Unable to complete AI analysis'],
        recommendations: ['Manual review recommended'],
        severity: 'medium',
        summary: 'AI analysis failed, manual review required'
      }
    }
  }

  /**
   * Analyze text content for crypto-related threats
   */
  async analyzeTextContent(content: string, context: 'website' | 'contract'): Promise<SecurityAnalysisResult> {
    if (!this.model) {
      throw new Error('Gemini AI not configured')
    }

    try {
      const prompt = `
Analyze the following ${context} content for security threats related to cryptocurrency and blockchain:

CONTENT:
${content.substring(0, 4000)} // Limit content length

Look for:
- Phishing indicators
- Scam patterns
- Malicious code patterns
- Social engineering attempts
- 0G Network related impersonation

Respond with JSON format:
{
  "riskScore": <0-100>,
  "confidence": <0-100>,
  "findings": [<findings array>],
  "recommendations": [<recommendations array>],
  "severity": "<low|medium|high|critical>",
  "summary": "<summary>"
}
`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      return this.parseSecurityAnalysis(text)
    } catch (error) {
      console.error('Gemini content analysis failed:', error)
      throw new Error('AI content analysis failed')
    }
  }

  /**
   * Check if Gemini AI is available
   */
  isAvailable(): boolean {
    return this.model !== null
  }
}

export const geminiAnalyzer = new GeminiSecurityAnalyzer()
