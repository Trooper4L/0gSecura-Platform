export interface TokenInfo {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
    verified: boolean;
    createdAt: string;
    creator: string;
    marketCap?: string;
    price?: string;
    holders: number;
}
export interface ContractAnalysis {
    address: string;
    verified: boolean;
    sourceCode: string | null;
    compiler: string | null;
    constructorArgs: string | null;
    creationTx: string;
    creator: string;
    hasProxyPattern: boolean;
    hasUpgradeability: boolean;
    hasOwnership: boolean;
    ownershipRenounced: boolean;
    hasPausability: boolean;
    hasBlacklist: boolean;
    hasWhitelist: boolean;
    hasMintFunction: boolean;
    hasBurnFunction: boolean;
    maxSupplyLimited: boolean;
    taxFeatures: {
        hasBuyTax: boolean;
        hasSellTax: boolean;
        buyTaxPercentage: number;
        sellTaxPercentage: number;
    };
}
export interface TransactionPattern {
    address: string;
    totalTransactions: number;
    uniqueAddresses: number;
    suspiciousPatterns: string[];
    riskScore: number;
    averageTransactionValue: string;
    largeTransactions: number;
    frequentTraders: number;
    botActivity: number;
    washTradingScore: number;
    liquidityEvents: {
        liquidityAdded: number;
        liquidityRemoved: number;
        rugPullRisk: number;
    };
}
export interface LiquidityAnalysis {
    totalLiquidity: string;
    liquidityLocked: boolean;
    lockDuration: number;
    liquidityProvider: string;
    poolAge: number;
    liquidityStability: number;
    impactFor1ETH: number;
    impactFor10ETH: number;
}
export interface HolderAnalysis {
    totalHolders: number;
    top10HoldersPercentage: number;
    top50HoldersPercentage: number;
    contractHolders: number;
    suspiciousHolders: number;
    holderDistribution: {
        whales: number;
        mediumHolders: number;
        smallHolders: number;
    };
    creatorBalance: number;
    teamTokensLocked: boolean;
}
export interface HoneypotAnalysis {
    isHoneypot: boolean;
    canBuy: boolean;
    canSell: boolean;
    buyTax: number;
    sellTax: number;
    transferTax: number;
    maxTxAmount: string;
    maxWalletAmount: string;
    honeypotReason: string[];
}
export interface SecurityScore {
    overall: number;
    contractSecurity: number;
    liquiditySecurity: number;
    holderSecurity: number;
    transactionSecurity: number;
    factors: {
        positive: string[];
        negative: string[];
        critical: string[];
    };
}
declare class OgBlockchainService {
    private provider;
    private apiKey;
    private baseUrl;
    private computeEndpoint;
    private storageEndpoint;
    private daEndpoint;
    constructor();
    private makeRequest;
    getTokenInfo(address: string): Promise<TokenInfo>;
    analyzeContract(address: string): Promise<ContractAnalysis>;
    getTransactionPatterns(address: string): Promise<TransactionPattern>;
    analyzeLiquidity(address: string): Promise<LiquidityAnalysis>;
    analyzeHolders(address: string): Promise<HolderAnalysis>;
    detectHoneypot(address: string): Promise<HoneypotAnalysis>;
    calculateSecurityScore(address: string): Promise<SecurityScore>;
    private generateMockTokenName;
    private generateMockSymbol;
    private generateMockAddress;
    private generateMockTxHash;
    private getContractCreationInfo;
    private getMarketData;
    private isContractVerified;
    private analyzeContractCode;
    checkBlacklist(address: string): Promise<boolean>;
    getBlacklistDetails(address: string): Promise<any[]>;
    getBlockNumber(): Promise<number>;
    getNetworkInfo(): Promise<{
        chainId: number;
        name: string;
    }>;
}
export declare const ogBlockchain: OgBlockchainService;
export {};
//# sourceMappingURL=og-blockchain.d.ts.map