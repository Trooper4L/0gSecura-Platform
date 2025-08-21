// Input validation utilities for security endpoints

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = "ValidationError"
  }
}

export function validateEthereumAddress(address: string): boolean {
  if (!address || typeof address !== "string") return false
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export function validateURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function validateDomain(domain: string): boolean {
  if (!domain || typeof domain !== "string") return false
  // Basic domain validation
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(domain)
}

export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== "string") throw new ValidationError("Input must be a string")
  return input.trim().substring(0, maxLength)
}

export function validateScanRequest(data: any): { type: string; address: string } {
  if (!data || typeof data !== "object") {
    throw new ValidationError("Invalid request data")
  }

  const { type, address } = data

  if (!type || !["token", "website"].includes(type)) {
    throw new ValidationError("Invalid scan type. Must be 'token' or 'website'", "type")
  }

  if (!address || typeof address !== "string") {
    throw new ValidationError("Address is required", "address")
  }

  const cleanAddress = sanitizeString(address, 200)

  if (type === "token") {
    if (!validateEthereumAddress(cleanAddress)) {
      throw new ValidationError("Invalid Ethereum address format", "address")
    }
  } else if (type === "website") {
    const urlToValidate = cleanAddress.startsWith("http") ? cleanAddress : `https://${cleanAddress}`
    if (!validateURL(urlToValidate)) {
      throw new ValidationError("Invalid URL format", "address")
    }
  }

  return { type, address: cleanAddress }
}

export function validateBlacklistEntry(data: any): {
  type: string
  value: string
  category: string
  severity: string
  source: string
  description: string
} {
  if (!data || typeof data !== "object") {
    throw new ValidationError("Invalid request data")
  }

  const { type, value, category, severity, source, description } = data

  // Validate type
  const validTypes = ["address", "domain", "contract", "url"]
  if (!type || !validTypes.includes(type)) {
    throw new ValidationError(`Invalid type. Must be one of: ${validTypes.join(", ")}`, "type")
  }

  // Validate value based on type
  if (!value || typeof value !== "string") {
    throw new ValidationError("Value is required", "value")
  }

  const cleanValue = sanitizeString(value, 200)

  if (type === "address" || type === "contract") {
    if (!validateEthereumAddress(cleanValue)) {
      throw new ValidationError("Invalid Ethereum address format", "value")
    }
  } else if (type === "url") {
    if (!validateURL(cleanValue)) {
      throw new ValidationError("Invalid URL format", "value")
    }
  } else if (type === "domain") {
    if (!validateDomain(cleanValue)) {
      throw new ValidationError("Invalid domain format", "value")
    }
  }

  // Validate category
  const validCategories = ["scam", "phishing", "honeypot", "rug-pull", "malware", "fake-website", "suspicious"]
  if (!category || !validCategories.includes(category)) {
    throw new ValidationError(`Invalid category. Must be one of: ${validCategories.join(", ")}`, "category")
  }

  // Validate severity
  const validSeverities = ["critical", "high", "medium", "low"]
  if (!severity || !validSeverities.includes(severity)) {
    throw new ValidationError(`Invalid severity. Must be one of: ${validSeverities.join(", ")}`, "severity")
  }

  // Validate source
  const validSources = ["community", "expert", "automated", "threat-intel", "partner"]
  if (!source || !validSources.includes(source)) {
    throw new ValidationError(`Invalid source. Must be one of: ${validSources.join(", ")}`, "source")
  }

  // Validate description
  if (!description || typeof description !== "string") {
    throw new ValidationError("Description is required", "description")
  }

  const cleanDescription = sanitizeString(description, 2000)
  if (cleanDescription.length < 10) {
    throw new ValidationError("Description must be at least 10 characters long", "description")
  }

  return {
    type,
    value: cleanValue,
    category,
    severity,
    source,
    description: cleanDescription,
  }
}

export function validateAlertData(data: any): {
  type: string
  severity: string
  title: string
  description: string
  affectedAddress: string
  reportedBy: string
  affectedDomain?: string
  tags?: string[]
} {
  if (!data || typeof data !== "object") {
    throw new ValidationError("Invalid request data")
  }

  const { type, severity, title, description, affectedAddress, reportedBy, affectedDomain, tags } = data

  // Validate type
  const validTypes = ["phishing", "scam-token", "malicious-contract", "rug-pull", "honeypot", "fake-website"]
  if (!type || !validTypes.includes(type)) {
    throw new ValidationError(`Invalid type. Must be one of: ${validTypes.join(", ")}`, "type")
  }

  // Validate severity
  const validSeverities = ["critical", "high", "medium", "low"]
  if (!severity || !validSeverities.includes(severity)) {
    throw new ValidationError(`Invalid severity. Must be one of: ${validSeverities.join(", ")}`, "severity")
  }

  // Validate title
  if (!title || typeof title !== "string") {
    throw new ValidationError("Title is required", "title")
  }

  const cleanTitle = sanitizeString(title, 200)
  if (cleanTitle.length < 5) {
    throw new ValidationError("Title must be at least 5 characters long", "title")
  }

  // Validate description
  if (!description || typeof description !== "string") {
    throw new ValidationError("Description is required", "description")
  }

  const cleanDescription = sanitizeString(description, 2000)
  if (cleanDescription.length < 20) {
    throw new ValidationError("Description must be at least 20 characters long", "description")
  }

  // Validate affected address
  if (!affectedAddress || typeof affectedAddress !== "string") {
    throw new ValidationError("Affected address is required", "affectedAddress")
  }

  const cleanAddress = sanitizeString(affectedAddress, 200)
  
  // Validate address format based on type
  if (["scam-token", "malicious-contract", "honeypot"].includes(type)) {
    if (!validateEthereumAddress(cleanAddress)) {
      throw new ValidationError("Invalid Ethereum address format for token/contract alert", "affectedAddress")
    }
  } else if (["phishing", "fake-website"].includes(type)) {
    const urlToValidate = cleanAddress.startsWith("http") ? cleanAddress : `https://${cleanAddress}`
    if (!validateURL(urlToValidate)) {
      throw new ValidationError("Invalid URL format for website alert", "affectedAddress")
    }
  }

  // Validate reported by
  if (!reportedBy || typeof reportedBy !== "string") {
    throw new ValidationError("Reporter information is required", "reportedBy")
  }

  const cleanReportedBy = sanitizeString(reportedBy, 100)

  // Validate optional fields
  let cleanDomain: string | undefined
  if (affectedDomain) {
    cleanDomain = sanitizeString(affectedDomain, 100)
    if (!validateDomain(cleanDomain)) {
      throw new ValidationError("Invalid domain format", "affectedDomain")
    }
  }

  let cleanTags: string[] | undefined
  if (tags && Array.isArray(tags)) {
    cleanTags = tags
      .filter(tag => typeof tag === "string" && tag.trim().length > 0)
      .map(tag => sanitizeString(tag, 50))
      .slice(0, 10) // Limit to 10 tags
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
  }
}

export function validatePaginationParams(searchParams: URLSearchParams): {
  limit: number
  offset: number
} {
  const limitParam = searchParams.get("limit")
  const offsetParam = searchParams.get("offset")

  const limit = limitParam ? Math.min(Math.max(parseInt(limitParam), 1), 100) : 50
  const offset = offsetParam ? Math.max(parseInt(offsetParam), 0) : 0

  return { limit, offset }
}
