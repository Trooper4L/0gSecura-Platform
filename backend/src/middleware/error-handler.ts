import { Request, Response, NextFunction } from 'express'
import { logger } from '@/utils/logger'

export interface ApiError extends Error {
  statusCode?: number
  field?: string
}

export class ValidationError extends Error {
  statusCode = 400
  field?: string

  constructor(message: string, field?: string) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
  }
}

export class BlockchainError extends Error {
  statusCode = 503

  constructor(message: string) {
    super(message)
    this.name = 'BlockchainError'
  }
}

export class StorageError extends Error {
  statusCode = 502

  constructor(message: string) {
    super(message)
    this.name = 'StorageError'
  }
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Don't handle if response already sent
  if (res.headersSent) {
    return next(err)
  }

  // Log error
  logger.error('API Error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  })

  // Determine status code
  const statusCode = err.statusCode || 500

  // Create error response
  const errorResponse: any = {
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method,
  }

  // Add field for validation errors
  if (err.field) {
    errorResponse.field = err.field
  }

  // Don't expose stack traces in production
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack
  }

  res.status(statusCode).json(errorResponse)
}

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
