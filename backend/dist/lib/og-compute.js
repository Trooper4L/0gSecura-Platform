"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ogCompute = void 0;
class OgComputeService {
    endpoint;
    apiKey;
    constructor() {
        this.endpoint = process.env.OG_COMPUTE_ENDPOINT || "https://compute.0g.ai";
        this.apiKey = process.env.OG_API_KEY || null;
    }
    async makeRequest(path, options = {}) {
        const url = `${this.endpoint}/api/v1${path}`;
        const headers = {
            "Content-Type": "application/json",
            ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
            ...options.headers,
        };
        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });
            if (!response.ok) {
                throw new Error(`0G Compute API Error: ${response.status} ${response.statusText}`);
            }
            return await response.json();
        }
        catch (error) {
            console.error("0G Compute API Error:", error);
            throw error;
        }
    }
    async submitAnalysisJob(request) {
        try {
            const response = await this.makeRequest("/jobs", {
                method: "POST",
                body: JSON.stringify({
                    jobType: "ai_security_analysis",
                    model: this.getModelForType(request.type),
                    input: request.data,
                    parameters: {
                        analysisType: request.type,
                        modelType: request.modelType || "security",
                    },
                }),
            });
            return response.jobId;
        }
        catch (error) {
            console.error("Failed to submit compute job:", error);
            throw new Error("Failed to submit analysis job to 0G Compute");
        }
    }
    async getJobStatus(jobId) {
        try {
            const response = await this.makeRequest(`/jobs/${jobId}`);
            return {
                jobId,
                status: response.status,
                progress: response.progress || 0,
                estimatedCompletion: response.estimatedCompletion,
                result: response.result,
                error: response.error,
            };
        }
        catch (error) {
            console.error("Failed to get job status:", error);
            throw new Error("Failed to retrieve job status");
        }
    }
    async waitForJobCompletion(jobId, maxWaitTime = 300000) {
        const startTime = Date.now();
        const pollInterval = 2000;
        while (Date.now() - startTime < maxWaitTime) {
            const status = await this.getJobStatus(jobId);
            if (status.status === "completed" && status.result) {
                return status.result;
            }
            if (status.status === "failed") {
                throw new Error(`Analysis job failed: ${status.error || "Unknown error"}`);
            }
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
        throw new Error("Analysis job timed out");
    }
    async analyzeTokenSecurity(tokenData) {
        const jobId = await this.submitAnalysisJob({
            type: "token_analysis",
            data: tokenData,
            modelType: "security",
        });
        return await this.waitForJobCompletion(jobId);
    }
    async detectPhishing(websiteData) {
        const jobId = await this.submitAnalysisJob({
            type: "phishing_detection",
            data: websiteData,
            modelType: "fraud_detection",
        });
        return await this.waitForJobCompletion(jobId);
    }
    async analyzeTransactionPatterns(transactionData) {
        const jobId = await this.submitAnalysisJob({
            type: "pattern_recognition",
            data: transactionData,
            modelType: "anomaly_detection",
        });
        return await this.waitForJobCompletion(jobId);
    }
    getModelForType(type) {
        const modelMap = {
            token_analysis: "security-analyzer-v2",
            phishing_detection: "phishing-detector-v1",
            pattern_recognition: "anomaly-detector-v1",
        };
        return modelMap[type] || "general-security-v1";
    }
    async getAvailableModels() {
        try {
            const response = await this.makeRequest("/models");
            return response.models || [];
        }
        catch (error) {
            console.warn("Failed to get available models:", error);
            return ["general-security-v1"];
        }
    }
    async getComputeQuota() {
        try {
            const response = await this.makeRequest("/quota");
            return {
                used: response.used || 0,
                limit: response.limit || 1000,
                resetTime: response.resetTime || new Date().toISOString(),
            };
        }
        catch (error) {
            console.warn("Failed to get compute quota:", error);
            return { used: 0, limit: 1000, resetTime: new Date().toISOString() };
        }
    }
}
exports.ogCompute = new OgComputeService();
//# sourceMappingURL=og-compute.js.map