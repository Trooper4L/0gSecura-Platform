export interface StorageMetadata {
    rootHash: string;
    size: number;
    contentType: string;
    uploadTime: string;
    lastAccessed: string;
    tags: string[];
}
export interface BlacklistData {
    id: string;
    type: "address" | "domain" | "contract" | "url";
    value: string;
    category: string;
    severity: string;
    source: string;
    description: string;
    evidence: any[];
    timestamp: string;
    verified: boolean;
}
export interface ThreatIntelligence {
    id: string;
    threatType: string;
    indicators: string[];
    description: string;
    severity: "low" | "medium" | "high" | "critical";
    confidence: number;
    source: string;
    firstSeen: string;
    lastSeen: string;
    references: string[];
}
declare class OgStorageService {
    private indexer;
    private provider;
    private signer;
    private rpcUrl;
    constructor();
    uploadBlacklistData(data: BlacklistData[]): Promise<string>;
    getBlacklistData(rootHash?: string): Promise<BlacklistData[]>;
    uploadThreatIntelligence(data: ThreatIntelligence[]): Promise<string>;
    getThreatIntelligence(rootHash?: string): Promise<ThreatIntelligence[]>;
    searchBlacklist(query: {
        value?: string;
        type?: string;
        category?: string;
        severity?: string;
        source?: string;
    }): Promise<BlacklistData[]>;
    storeSecurityReport(report: {
        id: string;
        type: "scan_result" | "threat_alert" | "analysis_report";
        data: any;
        metadata: any;
    }): Promise<string>;
    getSecurityReport(key: string): Promise<any>;
    getStorageMetrics(): Promise<{
        totalSize: number;
        recordCount: number;
        lastUpdate: string;
        availability: number;
    }>;
    syncWithThreatFeeds(): Promise<{
        updated: number;
        errors: string[];
    }>;
    createDataSnapshot(): Promise<string>;
}
export declare const ogStorage: OgStorageService;
export {};
//# sourceMappingURL=og-storage.d.ts.map