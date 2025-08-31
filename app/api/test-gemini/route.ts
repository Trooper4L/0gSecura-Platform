import { NextRequest, NextResponse } from 'next/server'
import { geminiAnalyzer } from '@/lib/gemini-ai'

export async function GET() {
  try {
    // Test if Gemini AI is properly configured
    if (!geminiAnalyzer.isAvailable()) {
      return NextResponse.json({
        status: 'error',
        message: 'Gemini AI not configured. Please add GEMINI_API_KEY to environment variables.',
        geminiConfigured: false
      }, { status: 503 })
    }

    // Test basic content analysis
    const testContent = "This is a test website for cryptocurrency investment opportunities. Join our exclusive Telegram group for insider trading tips!"
    
    try {
      const analysis = await geminiAnalyzer.analyzeTextContent(testContent, 'website')
      
      return NextResponse.json({
        status: 'success',
        message: 'Gemini AI is working correctly',
        geminiConfigured: true,
        testAnalysis: {
          riskScore: analysis.riskScore,
          confidence: analysis.confidence,
          severity: analysis.severity,
          findings: analysis.findings.slice(0, 3), // First 3 findings only
          summary: analysis.summary
        }
      })
    } catch (analysisError) {
      return NextResponse.json({
        status: 'error',
        message: 'Gemini AI configured but analysis failed',
        geminiConfigured: true,
        error: analysisError instanceof Error ? analysisError.message : 'Analysis failed'
      }, { status: 500 })
    }

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to test Gemini integration',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
