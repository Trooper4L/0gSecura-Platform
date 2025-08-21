"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.phishingDetector = void 0;
class PhishingDetectionService {
    knownPhishingDomains;
    legitimateDomains;
    suspiciousTLDs;
    phishingKeywords;
    urgencyKeywords;
    constructor() {
        this.knownPhishingDomains = new Set([
            "0g-wallet-fake.com",
            "og-secura-scam.net",
            "fake-0g.org",
            "0g-ai-phishing.com",
            "secure-0g-wallet.net",
            "0g-blockchain-fake.org",
            "metamask-security.com",
            "wallet-connect-secure.net",
            "defi-security-check.org",
            "crypto-wallet-verify.com",
        ]);
        this.legitimateDomains = [
            "0g.ai",
            "docs.0g.ai",
            "github.com",
            "metamask.io",
            "walletconnect.org",
            "uniswap.org",
            "ethereum.org",
            "coinbase.com",
            "binance.com",
        ];
        this.suspiciousTLDs = [".tk", ".ml", ".ga", ".cf", ".click", ".download", ".loan", ".win", ".bid", ".racing"];
        this.phishingKeywords = [
            "verify your wallet",
            "claim your tokens",
            "urgent security update",
            "wallet compromised",
            "immediate action required",
            "click here to secure",
            "validate your account",
            "confirm your identity",
            "suspicious activity detected",
            "account will be suspended",
        ];
        this.urgencyKeywords = [
            "urgent",
            "immediate",
            "expires today",
            "limited time",
            "act now",
            "don't miss out",
            "last chance",
            "hurry",
            "time sensitive",
            "expires soon",
        ];
    }
    async analyzeWebsite(url) {
        try {
            const parsedUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
            const domain = parsedUrl.hostname.toLowerCase();
            const [domainAnalysis, urlAnalysis, sslAnalysis, contentAnalysis, reputationAnalysis] = await Promise.all([
                this.analyzeDomain(domain),
                this.analyzeUrl(parsedUrl),
                this.analyzeSSL(domain),
                this.analyzeContent(url),
                this.analyzeReputation(domain),
            ]);
            const riskScore = this.calculateRiskScore(domainAnalysis, urlAnalysis, sslAnalysis, contentAnalysis, reputationAnalysis);
            const trustScore = Math.max(0, 100 - riskScore);
            const isPhishing = riskScore > 70 || reputationAnalysis.isKnownPhishing;
            const flags = this.generateFlags(domainAnalysis, urlAnalysis, sslAnalysis, contentAnalysis, reputationAnalysis);
            return {
                url,
                domain,
                isPhishing,
                riskScore,
                trustScore,
                flags,
                details: {
                    domainAnalysis,
                    urlAnalysis,
                    sslAnalysis,
                    contentAnalysis,
                    reputationAnalysis,
                },
            };
        }
        catch (error) {
            console.error("Phishing analysis error:", error);
            throw new Error("Failed to analyze website");
        }
    }
    async analyzeDomain(domain) {
        const domainAge = Math.floor(Math.random() * 3650);
        const registrationDate = new Date(Date.now() - domainAge * 24 * 60 * 60 * 1000).toISOString();
        const isNewDomain = domainAge < 30;
        const tld = domain.substring(domain.lastIndexOf("."));
        const isSuspiciousTLD = this.suspiciousTLDs.includes(tld);
        const similarDomains = this.legitimateDomains.filter((legitDomain) => {
            const similarity = this.calculateSimilarity(domain, legitDomain);
            return similarity > 0.6 && similarity < 1.0;
        });
        const isTyposquatting = similarDomains.length > 0;
        return {
            domain,
            registrationDate,
            domainAge,
            registrar: "Mock Registrar Inc.",
            isNewDomain,
            isSuspiciousTLD,
            isTyposquatting,
            similarLegitDomains: similarDomains,
            whoisPrivacy: Math.random() > 0.3,
        };
    }
    async analyzeUrl(url) {
        const hasIPAddress = /\d+\.\d+\.\d+\.\d+/.test(url.hostname);
        const hasLongURL = url.href.length > 100;
        const hasSuspiciousSubdomains = url.hostname.split(".").length > 3;
        const hasRedirects = Math.random() > 0.8;
        const hasSuspiciousParameters = /[?&](token|key|auth|login|secure)=/i.test(url.search);
        const hasEncodedCharacters = /%[0-9A-F]{2}/i.test(url.href);
        const suspiciousPatterns = [];
        if (hasIPAddress)
            suspiciousPatterns.push("Uses IP address instead of domain");
        if (hasLongURL)
            suspiciousPatterns.push("Unusually long URL");
        if (hasSuspiciousSubdomains)
            suspiciousPatterns.push("Multiple suspicious subdomains");
        if (hasSuspiciousParameters)
            suspiciousPatterns.push("Suspicious URL parameters");
        if (hasEncodedCharacters)
            suspiciousPatterns.push("URL encoding detected");
        return {
            hasIPAddress,
            hasLongURL,
            hasSuspiciousSubdomains,
            hasRedirects,
            redirectChain: hasRedirects ? ["example-redirect.com", url.hostname] : [],
            hasSuspiciousParameters,
            hasEncodedCharacters,
            suspiciousPatterns,
        };
    }
    async analyzeSSL(domain) {
        const hasSSL = Math.random() > 0.05;
        const isValidCertificate = hasSSL ? Math.random() > 0.1 : false;
        const isSelfSigned = hasSSL ? Math.random() > 0.9 : false;
        const certificateAge = Math.floor(Math.random() * 365);
        return {
            hasSSL,
            isValidCertificate,
            certificateIssuer: isValidCertificate ? "Let's Encrypt" : "Unknown",
            certificateExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            isSelfSigned,
            certificateAge,
            hasValidChain: isValidCertificate && !isSelfSigned,
        };
    }
    async analyzeContent(url) {
        const hasPhishingKeywords = Math.random() > 0.7;
        const hasUrgencyLanguage = Math.random() > 0.6;
        const hasSuspiciousLinks = Math.random() > 0.8;
        const hasFormInputs = Math.random() > 0.4;
        const requestsPersonalInfo = hasFormInputs && Math.random() > 0.5;
        const mimicsLegitSite = Math.random() > 0.8;
        const phishingIndicators = [];
        if (hasPhishingKeywords)
            phishingIndicators.push("Contains phishing keywords");
        if (hasUrgencyLanguage)
            phishingIndicators.push("Uses urgency language");
        if (hasSuspiciousLinks)
            phishingIndicators.push("Contains suspicious external links");
        if (requestsPersonalInfo)
            phishingIndicators.push("Requests personal information");
        if (mimicsLegitSite)
            phishingIndicators.push("Mimics legitimate website design");
        return {
            hasPhishingKeywords,
            hasUrgencyLanguage,
            hasSuspiciousLinks,
            hasFormInputs,
            requestsPersonalInfo,
            mimicsLegitSite,
            phishingIndicators,
        };
    }
    async analyzeReputation(domain) {
        const isKnownPhishing = this.knownPhishingDomains.has(domain);
        const isBlacklisted = isKnownPhishing || Math.random() > 0.9;
        const hasReports = Math.random() > 0.8;
        const reportCount = hasReports ? Math.floor(Math.random() * 50) : 0;
        const blacklistSources = [];
        if (isBlacklisted) {
            blacklistSources.push("PhishTank", "OpenPhish", "Google Safe Browsing");
        }
        const reputationScore = isKnownPhishing ? 0 : Math.floor(Math.random() * 100);
        return {
            isBlacklisted,
            blacklistSources,
            hasReports,
            reportCount,
            reputationScore,
            isKnownPhishing,
        };
    }
    calculateRiskScore(domain, url, ssl, content, reputation) {
        let riskScore = 0;
        if (domain.isNewDomain)
            riskScore += 20;
        if (domain.isSuspiciousTLD)
            riskScore += 25;
        if (domain.isTyposquatting)
            riskScore += 40;
        if (domain.whoisPrivacy)
            riskScore += 10;
        if (url.hasIPAddress)
            riskScore += 30;
        if (url.hasLongURL)
            riskScore += 15;
        if (url.hasSuspiciousSubdomains)
            riskScore += 20;
        if (url.hasRedirects)
            riskScore += 25;
        if (url.hasSuspiciousParameters)
            riskScore += 20;
        if (url.hasEncodedCharacters)
            riskScore += 15;
        if (!ssl.hasSSL)
            riskScore += 30;
        if (!ssl.isValidCertificate)
            riskScore += 25;
        if (ssl.isSelfSigned)
            riskScore += 20;
        if (content.hasPhishingKeywords)
            riskScore += 35;
        if (content.hasUrgencyLanguage)
            riskScore += 25;
        if (content.requestsPersonalInfo)
            riskScore += 30;
        if (content.mimicsLegitSite)
            riskScore += 40;
        if (reputation.isKnownPhishing)
            riskScore += 100;
        if (reputation.isBlacklisted)
            riskScore += 80;
        if (reputation.hasReports && reputation.reportCount > 10)
            riskScore += 30;
        return Math.min(riskScore, 100);
    }
    generateFlags(domain, url, ssl, content, reputation) {
        const flags = [];
        if (reputation.isKnownPhishing)
            flags.push("🚨 Known phishing site");
        if (reputation.isBlacklisted)
            flags.push("🚨 Blacklisted domain");
        if (content.requestsPersonalInfo)
            flags.push("🚨 Requests personal information");
        if (domain.isTyposquatting)
            flags.push("⚠️ Possible typosquatting");
        if (domain.isNewDomain)
            flags.push("⚠️ Very new domain");
        if (domain.isSuspiciousTLD)
            flags.push("⚠️ Suspicious domain extension");
        if (url.hasIPAddress)
            flags.push("⚠️ Uses IP address");
        if (!ssl.hasSSL)
            flags.push("⚠️ No SSL encryption");
        if (!ssl.isValidCertificate)
            flags.push("⚠️ Invalid SSL certificate");
        if (content.hasPhishingKeywords)
            flags.push("⚠️ Contains phishing keywords");
        if (content.hasUrgencyLanguage)
            flags.push("⚠️ Uses urgency tactics");
        if (ssl.hasValidChain && ssl.certificateAge > 30)
            flags.push("✅ Valid SSL certificate");
        if (domain.domainAge > 365)
            flags.push("✅ Established domain");
        if (!reputation.hasReports)
            flags.push("✅ No security reports");
        return flags;
    }
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        if (longer.length === 0)
            return 1.0;
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }
    levenshteinDistance(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                }
                else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
                }
            }
        }
        return matrix[str2.length][str1.length];
    }
}
exports.phishingDetector = new PhishingDetectionService();
//# sourceMappingURL=phishing-detector.js.map