import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { logger } from '@/utils/logger'
import { errorHandler } from '@/middleware/error-handler'
import { requestLogger } from '@/middleware/request-logger'

// Import routes
import healthRoutes from '@/routes/health'
import scanRoutes from '@/routes/scan'
import blacklistRoutes from '@/routes/blacklist'
import alertsRoutes from '@/routes/alerts'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 8000

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API
  crossOriginEmbedderPolicy: false,
}))

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}

app.use(cors(corsOptions))

// Compression and parsing
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.LOG_FORMAT || 'combined', {
    stream: { write: (message) => logger.info(message.trim()) }
  }))
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later',
    retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW || '900000') / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/', limiter)

// Request logging middleware
app.use(requestLogger)

// API Routes
app.use('/api/health', healthRoutes)
app.use('/api/scan', scanRoutes)
app.use('/api/blacklist', blacklistRoutes)
app.use('/api/alerts', alertsRoutes)

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: '0gSecura API',
    version: '1.0.0',
    description: 'Security scanner API for 0G blockchain',
    docs: '/api/health',
    blockchain: {
      network: process.env.OG_NETWORK_NAME || '0G-Galileo-Testnet',
      chainId: process.env.OG_CHAIN_ID || '16601',
      explorer: process.env.OG_CHAIN_EXPLORER,
    },
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
  })
})

// Error handling middleware (must be last)
app.use(errorHandler)

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  process.exit(0)
})

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`🚀 0gSecura API server running on port ${PORT}`)
    logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`)
    logger.info(`🔗 0G Network: ${process.env.OG_NETWORK_NAME || '0G-Galileo-Testnet'}`)
    logger.info(`📊 Health check: http://localhost:${PORT}/api/health`)
  })
}

export default app
