# Fetch Live Database to Local - Safe Sync Script
# This script downloads the live production database and replaces your local database
# WARNING: This will OVERWRITE your local database with live data!

$LIVE_SERVER = "root@jobs.jaiveeru.site"
$LIVE_PATH = "/home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site/prisma/dev.db"
$LOCAL_DB = "./prisma/dev.db"
$BACKUP_DB = "./prisma/dev.db.local-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fetching Live Database to Local" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Backup current local database
Write-Host "Step 1: Backing up current local database..." -ForegroundColor Yellow
if (Test-Path $LOCAL_DB) {
    Copy-Item $LOCAL_DB $BACKUP_DB
    Write-Host "✓ Local database backed up to: $BACKUP_DB" -ForegroundColor Green
} else {
    Write-Host "⚠ No local database found (this is OK for first time)" -ForegroundColor Yellow
}
Write-Host ""

# Step 2: Download live database
Write-Host "Step 2: Downloading live database from server..." -ForegroundColor Yellow
$TEMP_FILE = "./prisma/dev.db.temp"
scp "${LIVE_SERVER}:${LIVE_PATH}" $TEMP_FILE

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Live database downloaded successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to download database from live server" -ForegroundColor Red
    Write-Host "  Please check your SSH connection and server path" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Replace local database
Write-Host "Step 3: Replacing local database with live data..." -ForegroundColor Yellow
if (Test-Path $LOCAL_DB) {
    Remove-Item $LOCAL_DB
}
Move-Item $TEMP_FILE $LOCAL_DB
Write-Host "✓ Local database replaced with live database" -ForegroundColor Green
Write-Host ""

# Step 4: Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Database Sync Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your local database now matches the live production database." -ForegroundColor White
Write-Host ""
Write-Host "Backup saved at:" -ForegroundColor Yellow
Write-Host "  $BACKUP_DB" -ForegroundColor White
Write-Host ""
Write-Host "To restore your old local database if needed:" -ForegroundColor Yellow
Write-Host "  Copy-Item $BACKUP_DB $LOCAL_DB" -ForegroundColor White
Write-Host ""
