export interface AIAnalysisRequest {
    type: "token_analysis" | "phishing_detection" | "pattern_recognition";
    data: any;
    modelType?: "security" | "fraud_detection" | "anomaly_detection";
}
export interface AIAnalysisResult {
    confidence: number;
    riskScore: number;
    findings: string[];
    recommendations: string[];
    processingTime: number;
    modelUsed: string;
}
export interface ComputeJobStatus {
    jobId: string;
    status: "queued" | "running" | "completed" | "failed";
    progress: number;
    estimatedCompletion?: string;
    result?: AIAnalysisResult;
    error?: string;
}
declare class OgComputeService {
    private endpoint;
    private apiKey;
    constructor();
    private makeRequest;
    submitAnalysisJob(request: AIAnalysisRequest): Promise<string>;
    getJobStatus(jobId: string): Promise<ComputeJobStatus>;
    waitForJobCompletion(jobId: string, maxWaitTime?: number): Promise<AIAnalysisResult>;
    analyzeTokenSecurity(tokenData: any): Promise<AIAnalysisResult>;
    detectPhishing(websiteData: any): Promise<AIAnalysisResult>;
    analyzeTransactionPatterns(transactionData: any): Promise<AIAnalysisResult>;
    private getModelForType;
    getAvailableModels(): Promise<string[]>;
    getComputeQuota(): Promise<{
        used: number;
        limit: number;
        resetTime: string;
    }>;
}
export declare const ogCompute: OgComputeService;
export {};
//# sourceMappingURL=og-compute.d.ts.map