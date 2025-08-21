# Setup 0gSecura Backend
param(
    [switch]$SkipInstall,
    [switch]$DevMode
)

Write-Host "🚀 Setting up 0gSecura Backend with Express.js..." -ForegroundColor Green

$backendPath = "backend"
Set-Location $backendPath

if (-not $SkipInstall) {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

Write-Host "🔨 Building backend..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    Write-Host "🔧 Try fixing TypeScript errors first" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Backend built successfully!" -ForegroundColor Green

if ($DevMode) {
    Write-Host "🏃 Starting backend in development mode..." -ForegroundColor Cyan
    Write-Host "Backend will run on: http://localhost:8000" -ForegroundColor Blue
    Write-Host "Health check: http://localhost:8000/api/health" -ForegroundColor Blue
    Write-Host "API docs: http://localhost:8000/" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
    npm run dev
} else {
    Write-Host "🎯 Backend setup completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Configure .env.local in backend folder" -ForegroundColor White
    Write-Host "2. Add your 0G private key with testnet tokens" -ForegroundColor White
    Write-Host "3. Start backend: cd backend && npm run dev" -ForegroundColor White
    Write-Host "4. Start frontend: npm run dev (in root folder)" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 Backend will run on: http://localhost:8000" -ForegroundColor Blue
    Write-Host "🌐 Frontend will run on: http://localhost:3000" -ForegroundColor Blue
}

Set-Location ..
