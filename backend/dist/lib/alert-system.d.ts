export interface SecurityAlert {
    id: string;
    type: "phishing" | "scam-token" | "malicious-contract" | "rug-pull" | "honeypot" | "fake-website";
    severity: "critical" | "high" | "medium" | "low";
    title: string;
    description: string;
    affectedAddress: string;
    affectedDomain?: string;
    reportedBy: string;
    timestamp: string;
    status: "active" | "investigating" | "resolved" | "false-positive";
    affectedUsers: number;
    evidence: AlertEvidence[];
    tags: string[];
    upvotes: number;
    downvotes: number;
    verificationStatus: "unverified" | "community-verified" | "expert-verified";
}
export interface AlertEvidence {
    type: "transaction" | "screenshot" | "code-analysis" | "user-report";
    description: string;
    data: string;
    timestamp: string;
    submittedBy: string;
}
export interface AlertSubscription {
    userId: string;
    alertTypes: string[];
    severityLevels: string[];
    keywords: string[];
    notificationMethods: ("email" | "push" | "webhook")[];
}
export interface AlertStats {
    totalAlerts: number;
    activeAlerts: number;
    resolvedAlerts: number;
    criticalAlerts: number;
    alertsByType: Record<string, number>;
    alertsByDay: {
        date: string;
        count: number;
    }[];
}
declare class AlertSystemService {
    private alerts;
    private subscriptions;
    constructor();
    private initializeMockAlerts;
    getAllAlerts(filters?: {
        type?: string;
        severity?: string;
        status?: string;
        limit?: number;
    }): Promise<SecurityAlert[]>;
    getAlertById(id: string): Promise<SecurityAlert | null>;
    createAlert(alertData: Omit<SecurityAlert, "id" | "timestamp" | "upvotes" | "downvotes">): Promise<SecurityAlert>;
    updateAlertStatus(id: string, status: SecurityAlert["status"]): Promise<boolean>;
    voteOnAlert(id: string, vote: "up" | "down"): Promise<boolean>;
    addEvidence(alertId: string, evidence: Omit<AlertEvidence, "timestamp">): Promise<boolean>;
    getAlertStats(): Promise<AlertStats>;
    checkForAlerts(address: string, type: "token" | "website"): Promise<SecurityAlert[]>;
    subscribeToAlerts(subscription: AlertSubscription): Promise<boolean>;
    getSubscription(userId: string): Promise<AlertSubscription | null>;
}
export declare const alertSystem: AlertSystemService;
export {};
//# sourceMappingURL=alert-system.d.ts.map