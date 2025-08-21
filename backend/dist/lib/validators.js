"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = void 0;
exports.validateEthereumAddress = validateEthereumAddress;
exports.validateURL = validateURL;
exports.validateDomain = validateDomain;
exports.sanitizeString = sanitizeString;
exports.validateScanRequest = validateScanRequest;
exports.validateBlacklistEntry = validateBlacklistEntry;
exports.validateAlertData = validateAlertData;
exports.validatePaginationParams = validatePaginationParams;
class ValidationError extends Error {
    field;
    constructor(message, field) {
        super(message);
        this.field = field;
        this.name = "ValidationError";
    }
}
exports.ValidationError = ValidationError;
function validateEthereumAddress(address) {
    if (!address || typeof address !== "string")
        return false;
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}
function validateURL(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
function validateDomain(domain) {
    if (!domain || typeof domain !== "string")
        return false;
    return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(domain);
}
function sanitizeString(input, maxLength = 1000) {
    if (typeof input !== "string")
        throw new ValidationError("Input must be a string");
    return input.trim().substring(0, maxLength);
}
function validateScanRequest(data) {
    if (!data || typeof data !== "object") {
        throw new ValidationError("Invalid request data");
    }
    const { type, address } = data;
    if (!type || !["token", "website"].includes(type)) {
        throw new ValidationError("Invalid scan type. Must be 'token' or 'website'", "type");
    }
    if (!address || typeof address !== "string") {
        throw new ValidationError("Address is required", "address");
    }
    const cleanAddress = sanitizeString(address, 200);
    if (type === "token") {
        if (!validateEthereumAddress(cleanAddress)) {
            throw new ValidationError("Invalid Ethereum address format", "address");
        }
    }
    else if (type === "website") {
        const urlToValidate = cleanAddress.startsWith("http") ? cleanAddress : `https://${cleanAddress}`;
        if (!validateURL(urlToValidate)) {
            throw new ValidationError("Invalid URL format", "address");
        }
    }
    return { type, address: cleanAddress };
}
function validateBlacklistEntry(data) {
    if (!data || typeof data !== "object") {
        throw new ValidationError("Invalid request data");
    }
    const { type, value, category, severity, source, description } = data;
    const validTypes = ["address", "domain", "contract", "url"];
    if (!type || !validTypes.includes(type)) {
        throw new ValidationError(`Invalid type. Must be one of: ${validTypes.join(", ")}`, "type");
    }
    if (!value || typeof value !== "string") {
        throw new ValidationError("Value is required", "value");
    }
    const cleanValue = sanitizeString(value, 200);
    if (type === "address" || type === "contract") {
        if (!validateEthereumAddress(cleanValue)) {
            throw new ValidationError("Invalid Ethereum address format", "value");
        }
    }
    else if (type === "url") {
        if (!validateURL(cleanValue)) {
            throw new ValidationError("Invalid URL format", "value");
        }
    }
    else if (type === "domain") {
        if (!validateDomain(cleanValue)) {
            throw new ValidationError("Invalid domain format", "value");
        }
    }
    const validCategories = ["scam", "phishing", "honeypot", "rug-pull", "malware", "fake-website", "suspicious"];
    if (!category || !validCategories.includes(category)) {
        throw new ValidationError(`Invalid category. Must be one of: ${validCategories.join(", ")}`, "category");
    }
    const validSeverities = ["critical", "high", "medium", "low"];
    if (!severity || !validSeverities.includes(severity)) {
        throw new ValidationError(`Invalid severity. Must be one of: ${validSeverities.join(", ")}`, "severity");
    }
    const validSources = ["community", "expert", "automated", "threat-intel", "partner"];
    if (!source || !validSources.includes(source)) {
        throw new ValidationError(`Invalid source. Must be one of: ${validSources.join(", ")}`, "source");
    }
    if (!description || typeof description !== "string") {
        throw new ValidationError("Description is required", "description");
    }
    const cleanDescription = sanitizeString(description, 2000);
    if (cleanDescription.length < 10) {
        throw new ValidationError("Description must be at least 10 characters long", "description");
    }
    return {
        type,
        value: cleanValue,
        category,
        severity,
        source,
        description: cleanDescription,
    };
}
function validateAlertData(data) {
    if (!data || typeof data !== "object") {
        throw new ValidationError("Invalid request data");
    }
    const { type, severity, title, description, affectedAddress, reportedBy, affectedDomain, tags } = data;
    const validTypes = ["phishing", "scam-token", "malicious-contract", "rug-pull", "honeypot", "fake-website"];
    if (!type || !validTypes.includes(type)) {
        throw new ValidationError(`Invalid type. Must be one of: ${validTypes.join(", ")}`, "type");
    }
    const validSeverities = ["critical", "high", "medium", "low"];
    if (!severity || !validSeverities.includes(severity)) {
        throw new ValidationError(`Invalid severity. Must be one of: ${validSeverities.join(", ")}`, "severity");
    }
    if (!title || typeof title !== "string") {
        throw new ValidationError("Title is required", "title");
    }
    const cleanTitle = sanitizeString(title, 200);
    if (cleanTitle.length < 5) {
        throw new ValidationError("Title must be at least 5 characters long", "title");
    }
    if (!description || typeof description !== "string") {
        throw new ValidationError("Description is required", "description");
    }
    const cleanDescription = sanitizeString(description, 2000);
    if (cleanDescription.length < 20) {
        throw new ValidationError("Description must be at least 20 characters long", "description");
    }
    if (!affectedAddress || typeof affectedAddress !== "string") {
        throw new ValidationError("Affected address is required", "affectedAddress");
    }
    const cleanAddress = sanitizeString(affectedAddress, 200);
    if (["scam-token", "malicious-contract", "honeypot"].includes(type)) {
        if (!validateEthereumAddress(cleanAddress)) {
            throw new ValidationError("Invalid Ethereum address format for token/contract alert", "affectedAddress");
        }
    }
    else if (["phishing", "fake-website"].includes(type)) {
        const urlToValidate = cleanAddress.startsWith("http") ? cleanAddress : `https://${cleanAddress}`;
        if (!validateURL(urlToValidate)) {
            throw new ValidationError("Invalid URL format for website alert", "affectedAddress");
        }
    }
    if (!reportedBy || typeof reportedBy !== "string") {
        throw new ValidationError("Reporter information is required", "reportedBy");
    }
    const cleanReportedBy = sanitizeString(reportedBy, 100);
    let cleanDomain;
    if (affectedDomain) {
        cleanDomain = sanitizeString(affectedDomain, 100);
        if (!validateDomain(cleanDomain)) {
            throw new ValidationError("Invalid domain format", "affectedDomain");
        }
    }
    let cleanTags;
    if (tags && Array.isArray(tags)) {
        cleanTags = tags
            .filter(tag => typeof tag === "string" && tag.trim().length > 0)
            .map(tag => sanitizeString(tag, 50))
            .slice(0, 10);
    }
    return {
        type,
        severity,
        title: cleanTitle,
        description: cleanDescription,
        affectedAddress: cleanAddress,
        reportedBy: cleanReportedBy,
        affectedDomain: cleanDomain,
        tags: cleanTags,
    };
}
function validatePaginationParams(searchParams) {
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam), 1), 100) : 50;
    const offset = offsetParam ? Math.max(parseInt(offsetParam), 0) : 0;
    return { limit, offset };
}
//# sourceMappingURL=validators.js.map