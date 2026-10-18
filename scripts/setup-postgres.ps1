# RentRide Local PostgreSQL Setup Script
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " RentRide PostgreSQL Setup Verification " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Check if PostgreSQL service is installed/running
$pgService = Get-Service -Name *postgres* -ErrorAction SilentlyContinue | Select-Object -First 1
if ($null -eq $pgService) {
    Write-Host "[WARNING] No Windows service matching '*postgres*' found. Ensure PostgreSQL is installed and listening on port 5432." -ForegroundColor Yellow
} else {
    Write-Host "[OK] PostgreSQL service found: $($pgService.Name) (Status: $($pgService.Status))" -ForegroundColor Green
    if ($pgService.Status -ne 'Running') {
        Write-Host "Attempting to start PostgreSQL service..." -ForegroundColor Yellow
        Start-Service -Name $pgService.Name -ErrorAction SilentlyContinue
    }
}

# 2. Check .env file
$envPath = Join-Path $PSScriptRoot "..\.env"
if (-not (Test-Path $envPath)) {
    Write-Host "[ERROR] .env file not found at $envPath." -ForegroundColor Red
    Write-Host "Please copy .env.example to .env and configure DATABASE_URL first." -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] .env file located." -ForegroundColor Green

# 3. Run drizzle-kit push
Write-Host "`nRunning schema sync (drizzle-kit push)..." -ForegroundColor Cyan
npm run db:push -w rentride-api
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to push schema to PostgreSQL. Check your DATABASE_URL credentials in .env." -ForegroundColor Red
    exit $LASTEXITCODE
}
Write-Host "[OK] Database schema synced successfully." -ForegroundColor Green

# 4. Run seed
Write-Host "`nRunning seed script to populate initial users and fleet..." -ForegroundColor Cyan
npm run seed -w rentride-api
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] Seeding encountered an error. Check SEED_* environment variables." -ForegroundColor Yellow
} else {
    Write-Host "[OK] Database seeded successfully." -ForegroundColor Green
}

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host " Database setup complete! You can run:" -ForegroundColor Green
Write-Host "   npm run dev   (or npm start)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Green
