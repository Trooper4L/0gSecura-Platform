# PowerShell script to install PostgreSQL on Windows
# Run as Administrator

Write-Host "🗄️  Installing PostgreSQL for 0gSecura..." -ForegroundColor Green

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Check if PostgreSQL is already installed
$pgPath = "C:\Program Files\PostgreSQL\15\bin\psql.exe"
if (Test-Path $pgPath) {
    Write-Host "✅ PostgreSQL already installed at: $pgPath" -ForegroundColor Green
    Write-Host "🔧 Testing connection..." -ForegroundColor Yellow
    & $pgPath --version
    exit 0
}

# Download PostgreSQL installer
$downloadUrl = "https://sbp.enterprisedb.com/getfile.jsp?fileid=1258893"
$installerPath = "$env:TEMP\postgresql-15-windows-x64.exe"

Write-Host "📥 Downloading PostgreSQL installer..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath -UseBasicParsing
    Write-Host "✅ Download completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Download failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "🌐 Please download manually from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

# Install PostgreSQL silently
Write-Host "🚀 Installing PostgreSQL..." -ForegroundColor Yellow
Write-Host "⏳ This may take a few minutes..." -ForegroundColor Yellow

$password = Read-Host -Prompt "Enter password for PostgreSQL superuser (postgres)" -AsSecureString
$plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

try {
    $installArgs = @(
        "--mode", "unattended",
        "--unattendedmodeui", "minimal",
        "--superpassword", $plainPassword,
        "--servicename", "postgresql-x64-15",
        "--servicepassword", $plainPassword,
        "--serverport", "5432",
        "--locale", "English, United States",
        "--datadir", "C:\Program Files\PostgreSQL\15\data"
    )
    
    Start-Process -FilePath $installerPath -ArgumentList $installArgs -Wait -NoNewWindow
    Write-Host "✅ PostgreSQL installation completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Installation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Add PostgreSQL to PATH
$pgBinPath = "C:\Program Files\PostgreSQL\15\bin"
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
if ($currentPath -notlike "*$pgBinPath*") {
    Write-Host "🔧 Adding PostgreSQL to system PATH..." -ForegroundColor Yellow
    $newPath = "$currentPath;$pgBinPath"
    [Environment]::SetEnvironmentVariable("PATH", $newPath, "Machine")
    Write-Host "✅ PATH updated - restart your terminal" -ForegroundColor Green
}

# Test installation
Write-Host "🧪 Testing PostgreSQL installation..." -ForegroundColor Yellow
try {
    & "$pgBinPath\psql.exe" --version
    Write-Host "✅ PostgreSQL is working correctly!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  PostgreSQL installed but PATH not updated yet" -ForegroundColor Yellow
    Write-Host "🔄 Please restart your terminal and try again" -ForegroundColor Yellow
}

# Create database and user
Write-Host "`n🗄️  Setting up 0gSecura database..." -ForegroundColor Yellow
$setupSql = @"
CREATE DATABASE ogsecura;
CREATE USER ogsecura WITH PASSWORD 'ogsecura123';
GRANT ALL PRIVILEGES ON DATABASE ogsecura TO ogsecura;
\q
"@

$setupSql | & "$pgBinPath\psql.exe" -U postgres -h localhost

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Update your .env.local with: DATABASE_URL=postgresql://ogsecura:ogsecura123@localhost:5432/ogsecura" -ForegroundColor White
Write-Host "2. Run: npm run setup-db (to create tables)" -ForegroundColor White
Write-Host "3. Test with: npm run test-db" -ForegroundColor White

# Cleanup
Remove-Item $installerPath -ErrorAction SilentlyContinue

Write-Host "`n🎉 PostgreSQL setup completed!" -ForegroundColor Green
