export declare class ValidationError extends Error {
    field?: string | undefined;
    constructor(message: string, field?: string | undefined);
}
export declare function validateEthereumAddress(address: string): boolean;
export declare function validateURL(url: string): boolean;
export declare function validateDomain(domain: string): boolean;
export declare function sanitizeString(input: string, maxLength?: number): string;
export declare function validateScanRequest(data: any): {
    type: string;
    address: string;
};
export declare function validateBlacklistEntry(data: any): {
    type: string;
    value: string;
    category: string;
    severity: string;
    source: string;
    description: string;
};
export declare function validateAlertData(data: any): {
    type: string;
    severity: string;
    title: string;
    description: string;
    affectedAddress: string;
    reportedBy: string;
    affectedDomain?: string;
    tags?: string[];
};
export declare function validatePaginationParams(searchParams: URLSearchParams): {
    limit: number;
    offset: number;
};
//# sourceMappingURL=validators.d.ts.map