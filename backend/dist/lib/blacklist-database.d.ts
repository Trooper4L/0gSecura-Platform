export interface BlacklistEntry {
    id: string;
    type: "address" | "domain" | "contract" | "url";
    value: string;
    category: "scam" | "phishing" | "honeypot" | "rug-pull" | "malware" | "fake-website" | "suspicious";
    severity: "critical" | "high" | "medium" | "low";
    source: "community" | "expert" | "automated" | "threat-intel" | "partner";
    description: string;
    evidence: BlacklistEvidence[];
    reportedBy: string;
    verifiedBy?: string;
    timestamp: string;
    lastUpdated: string;
    status: "active" | "pending" | "disputed" | "resolved" | "false-positive";
    confidence: number;
    reports: number;
    upvotes: number;
    downvotes: number;
    tags: string[];
    relatedEntries: string[];
    expiresAt?: string;
}
export interface BlacklistEvidence {
    type: "transaction" | "screenshot" | "code-analysis" | "user-report" | "external-source";
    description: string;
    data: string;
    source: string;
    timestamp: string;
    verified: boolean;
}
export interface BlacklistStats {
    totalEntries: number;
    activeEntries: number;
    pendingEntries: number;
    entriesByCategory: Record<string, number>;
    entriesByType: Record<string, number>;
    entriesBySource: Record<string, number>;
    recentAdditions: number;
    communityReports: number;
    verificationRate: number;
}
export interface BlacklistQuery {
    type?: string;
    category?: string;
    severity?: string;
    source?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
}
declare class BlacklistDatabaseService {
    private entries;
    private domainIndex;
    private addressIndex;
    constructor();
    private initializeDatabase;
    private generateId;
    private addEntry;
    private updateIndexes;
    checkBlacklist(value: string, type: "address" | "domain" | "url"): Promise<BlacklistEntry[]>;
    getAllEntries(query?: BlacklistQuery): Promise<{
        entries: BlacklistEntry[];
        total: number;
    }>;
    getEntryById(id: string): Promise<BlacklistEntry | null>;
    addBlacklistEntry(entry: Omit<BlacklistEntry, "id" | "timestamp" | "lastUpdated" | "reports" | "upvotes" | "downvotes">): Promise<BlacklistEntry>;
    updateEntry(id: string, updates: Partial<BlacklistEntry>): Promise<boolean>;
    voteOnEntry(id: string, vote: "up" | "down"): Promise<boolean>;
    addEvidence(id: string, evidence: Omit<BlacklistEvidence, "timestamp" | "verified">): Promise<boolean>;
    getStats(): Promise<BlacklistStats>;
    searchSimilar(value: string, type: "address" | "domain"): Promise<BlacklistEntry[]>;
    private calculateSimilarity;
    private levenshteinDistance;
}
export declare const blacklistDatabase: BlacklistDatabaseService;
export {};
//# sourceMappingURL=blacklist-database.d.ts.map