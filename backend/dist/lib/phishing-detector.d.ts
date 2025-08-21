export interface PhishingAnalysis {
    url: string;
    domain: string;
    isPhishing: boolean;
    riskScore: number;
    trustScore: number;
    flags: string[];
    details: {
        domainAnalysis: DomainAnalysis;
        urlAnalysis: UrlAnalysis;
        sslAnalysis: SslAnalysis;
        contentAnalysis: ContentAnalysis;
        reputationAnalysis: ReputationAnalysis;
    };
}
export interface DomainAnalysis {
    domain: string;
    registrationDate: string;
    domainAge: number;
    registrar: string;
    isNewDomain: boolean;
    isSuspiciousTLD: boolean;
    isTyposquatting: boolean;
    similarLegitDomains: string[];
    whoisPrivacy: boolean;
}
export interface UrlAnalysis {
    hasIPAddress: boolean;
    hasLongURL: boolean;
    hasSuspiciousSubdomains: boolean;
    hasRedirects: boolean;
    redirectChain: string[];
    hasSuspiciousParameters: boolean;
    hasEncodedCharacters: boolean;
    suspiciousPatterns: string[];
}
export interface SslAnalysis {
    hasSSL: boolean;
    isValidCertificate: boolean;
    certificateIssuer: string;
    certificateExpiry: string;
    isSelfSigned: boolean;
    certificateAge: number;
    hasValidChain: boolean;
}
export interface ContentAnalysis {
    hasPhishingKeywords: boolean;
    hasUrgencyLanguage: boolean;
    hasSuspiciousLinks: boolean;
    hasFormInputs: boolean;
    requestsPersonalInfo: boolean;
    mimicsLegitSite: boolean;
    phishingIndicators: string[];
}
export interface ReputationAnalysis {
    isBlacklisted: boolean;
    blacklistSources: string[];
    hasReports: boolean;
    reportCount: number;
    reputationScore: number;
    isKnownPhishing: boolean;
}
declare class PhishingDetectionService {
    private knownPhishingDomains;
    private legitimateDomains;
    private suspiciousTLDs;
    private phishingKeywords;
    private urgencyKeywords;
    constructor();
    analyzeWebsite(url: string): Promise<PhishingAnalysis>;
    private analyzeDomain;
    private analyzeUrl;
    private analyzeSSL;
    private analyzeContent;
    private analyzeReputation;
    private calculateRiskScore;
    private generateFlags;
    private calculateSimilarity;
    private levenshteinDistance;
}
export declare const phishingDetector: PhishingDetectionService;
export {};
//# sourceMappingURL=phishing-detector.d.ts.map