# 0gSecura - Blockchain Security Scanner for 0G Network

A comprehensive security platform built for the 0G Galileo Testnet that provides real-time threat detection, smart contract analysis, and community-driven blacklist management.

## 🚀 Features

- **Smart Contract Analysis**: Deep analysis of token contracts using 0G blockchain data
- **Real-time Threat Detection**: AI-powered security scanning with threat intelligence
- **Community Blacklist**: Distributed blacklist management using 0G Storage
- **Phishing Protection**: Website and URL analysis for fraud prevention
- **0G Network Integration**: Native integration with 0G Chain, Storage, Compute, and DA services

## 🏗️ Architecture

- **Frontend**: Next.js 15 with React 18 and Tailwind CSS
- **Backend**: Next.js API routes with TypeScript
- **Blockchain**: 0G Galileo Testnet (Chain ID: 16601)
- **Storage**: 0G Storage network for distributed data
- **AI**: 0G Compute network for threat analysis
- **Database**: PostgreSQL for local data storage
- **Caching**: Redis for performance optimization

## 📋 Prerequisites

1. **Node.js 18+** and npm/pnpm
2. **0G Testnet tokens** from [0G Faucet](https://faucet.0g.ai)
3. **PostgreSQL** (optional, for production)
4. **Redis** (optional, for production)

## 🛠️ Setup

### 1. Clone and Install

```bash
git clone <your-repo>
cd 0gsecura
npm install
```

### 2. Environment Configuration

Copy the environment template:

```bash
cp .env.example .env.local
```

Configure your `.env.local`:

```bash
# 0G Galileo Testnet (Required)
OG_CHAIN_RPC_URL=https://evmrpc-testnet.0g.ai
OG_CHAIN_ID=16601
OG_INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai

# Your private key with testnet tokens (for storage operations)
OG_PRIVATE_KEY=your_private_key_here

# Application security
NEXTAUTH_SECRET=your_secure_random_string_here
NEXTAUTH_URL=http://localhost:3000

# Optional: Enhanced features
VIRUSTOTAL_API_KEY=your_virustotal_api_key
DATABASE_URL=postgresql://user:pass@localhost:5432/ogsecura
REDIS_URL=redis://localhost:6379
```

### 3. Get Testnet Tokens

1. Visit [0G Faucet](https://faucet.0g.ai)
2. Enter your wallet address
3. Receive 0.1 OG tokens daily
4. Use the private key in your environment configuration

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🧪 Testing the Application

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Test Token Scanning
```bash
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{"type": "token", "address": "0x1234567890123456789012345678901234567890"}'
```

### Test Website Analysis
```bash
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{"type": "website", "address": "https://example.com"}'
```

## 🌐 0G Network Resources

- **Testnet Explorer**: https://chainscan-galileo.0g.ai
- **Storage Explorer**: https://storagescan-galileo.0g.ai
- **Documentation**: https://docs.0g.ai
- **Discord**: https://discord.gg/0glabs

## 🏗️ Production Deployment

### Docker Deployment

```bash
# Build and run
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f app
```

### Manual Deployment

```bash
# Build application
npm run build

# Start production server
npm start
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 🛡️ Security Features

### Smart Contract Analysis
- Contract verification status
- Ownership analysis
- Function analysis (mint, burn, pause)
- Tax mechanism detection
- Proxy pattern detection
  
## Transaction Analyzer and Simulator
- A user is able to analyze a transaction hash before approval in a wallet
- The analyzer can make use of the AI models available on 0g compute or Gemini's Flash 1.5.

### Website Security
- SSL certificate validation
- Domain age analysis
- Phishing database checks
- URL pattern analysis

### Community Features
- Threat reporting system
- Community-driven blacklists
- Evidence-based verification
- Voting and reputation system

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server
npm run lint        # Run ESLint
```

### Project Structure

```
0gsecura/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   └── page.tsx          # Homepage
├── components/            # React components
│   ├── ui/               # UI components
│   ├── security-scanner.tsx
│   ├── blacklist-manager.tsx
│   └── threat-alerts.tsx
├── lib/                  # Utility libraries
│   ├── og-blockchain.ts  # 0G blockchain integration
│   ├── og-storage.ts     # 0G storage integration
│   ├── og-compute.ts     # 0G compute integration
│   └── validators.ts     # Input validation
└── scripts/              # Deployment scripts
```

## 📊 Monitoring

### Health Endpoint
GET `/api/health` - Application health status

### Metrics
- Blockchain connectivity
- Storage system status
- API response times
- Rate limiting status

## Roadmap
- Week 1: Basic working demo (MVP), System architechture and UI design.
- Week 2: Working Demo deliverable with 0g features implemented (0g chain, 0g storage).
- Week 3: UI/UX improvement of the Platform (user signup/signin integrated), additional features integrated (Transaction Analyzer, Connected Dapps feature) with mock data for testing.
- Week 4: Community reporting of maliciious websites and tokens beta testing with 0g storage.
- Week 5: Complete testing and working deliverable of all features
- Week 6: Platform improvements.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- **Documentation**: Check the [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed setup
- **0G Discord**: Get help from the 0G community
- **Issues**: Report bugs via GitHub issues

---

Built with ❤️ for the 0G ecosystem
