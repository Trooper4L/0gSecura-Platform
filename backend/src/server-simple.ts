import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import dotenv from 'dotenv'
import healthRoutes from './routes/health-simple'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 8000

// Security middleware
app.use(helmet())

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}))

// Basic middleware
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/health', healthRoutes)

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: '0gSecura API',
    version: '1.0.0',
    description: 'Security scanner API for 0G blockchain',
    endpoints: {
      health: '/api/health',
      scan: '/api/scan',
      blacklist: '/api/blacklist',
      alerts: '/api/alerts',
    },
    blockchain: {
      network: process.env.OG_NETWORK_NAME || '0G-Galileo-Testnet',
      chainId: process.env.OG_CHAIN_ID || '16601',
    },
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 0gSecura API server running on port ${PORT}`)
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
})

export default app
