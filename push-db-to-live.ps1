# Push Local Database to Live - DANGEROUS! Use with caution!
# This script uploads your LOCAL database to PRODUCTION
# WARNING: This will OVERWRITE the live production database!
# Only use this for testing or when you're absolutely sure!

$LIVE_SERVER = "root@jobs.jaiveeru.site"
$LIVE_PATH = "/home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site/prisma/dev.db"
$LOCAL_DB = "./prisma/dev.db"

Write-Host "========================================" -ForegroundColor Red
Write-Host "⚠ WARNING: PUSH LOCAL DATABASE TO LIVE" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""
Write-Host "This will OVERWRITE your LIVE PRODUCTION database!" -ForegroundColor Red
Write-Host "All current live data will be REPLACED with your local data!" -ForegroundColor Red
Write-Host ""

# Confirm action
$confirmation = Read-Host "Type 'YES' to continue (anything else will cancel)"
if ($confirmation -ne "YES") {
    Write-Host ""
    Write-Host "✓ Cancelled. No changes made." -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Proceeding with database upload..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

# Check local database exists
if (-not (Test-Path $LOCAL_DB)) {
    Write-Host "✗ Error: Local database not found at $LOCAL_DB" -ForegroundColor Red
    exit 1
}

# Step 1: Backup live database first
Write-Host "Step 1: Backing up live database..." -ForegroundColor Yellow
$BACKUP_NAME = "dev.db.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
ssh $LIVE_SERVER "cp ${LIVE_PATH} ${LIVE_PATH}.backup-`$(date +%Y%m%d-%H%M%S)"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Live database backed up on server" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to backup live database" -ForegroundColor Red
    Write-Host "  Aborting push for safety!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Upload local database
Write-Host "Step 2: Uploading local database to live server..." -ForegroundColor Yellow
scp $LOCAL_DB "${LIVE_SERVER}:${LIVE_PATH}.temp"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database uploaded successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to upload database" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Replace live database
Write-Host "Step 3: Replacing live database..." -ForegroundColor Yellow
ssh $LIVE_SERVER "mv ${LIVE_PATH}.temp ${LIVE_PATH}"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Live database replaced" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to replace live database" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Restart application (if needed)
Write-Host "Step 4: Restarting application..." -ForegroundColor Yellow
Write-Host "⚠ You may need to manually restart your app on the live server" -ForegroundColor Yellow
Write-Host "  SSH command: ssh $LIVE_SERVER" -ForegroundColor White
Write-Host "  Then restart: pm2 restart all (or your restart command)" -ForegroundColor White
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Database Push Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your live database now matches your local database." -ForegroundColor White
Write-Host ""
Write-Host "⚠ Important: Test the live site immediately!" -ForegroundColor Yellow
Write-Host ""
Write-Host "To restore the live backup if something went wrong:" -ForegroundColor Yellow
Write-Host "  ssh $LIVE_SERVER" -ForegroundColor White
Write-Host "  Find latest backup: ls -lt ${LIVE_PATH}.backup-*" -ForegroundColor White
Write-Host "  Restore: cp ${LIVE_PATH}.backup-XXXXXX ${LIVE_PATH}" -ForegroundColor White
Write-Host ""
