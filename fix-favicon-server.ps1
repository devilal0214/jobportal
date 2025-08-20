# Quick PowerShell script to fix favicon on server
Write-Host "🔧 Fixing favicon 404 on production server..." -ForegroundColor Yellow

# Create SSH commands to fix the favicon location
$sshCommands = @"
cd /home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site
echo "📁 Current directory: `$(pwd)"
echo "📋 Files in src/:"
ls -la src/ | grep favicon || echo "No favicon in src/"
echo "📋 Files in src/app/:"
ls -la src/app/ | grep favicon || echo "No favicon in src/app/"
echo "🔄 Creating app directory..."
mkdir -p src/app
if [ -f "src/favicon.ico" ]; then
    echo "📦 Moving favicon to correct location..."
    mv src/favicon.ico src/app/favicon.ico
    echo "✅ Favicon moved!"
else
    echo "❌ Favicon not found in src/"
fi
echo "🔍 Verifying..."
ls -la src/app/favicon.ico
chmod 644 src/app/favicon.ico
echo "🎯 Testing URL..."
curl -I https://jobs.jaiveeru.site/favicon.ico | head -1
"@

Write-Host "📡 Connecting to server to fix favicon..." -ForegroundColor Cyan
Write-Host "Commands to run on server:" -ForegroundColor Gray
Write-Host $sshCommands -ForegroundColor DarkGray

# You can copy these commands and run them manually via SSH
Write-Host "`n🔧 Manual fix steps:" -ForegroundColor Yellow
Write-Host "1. SSH to server: ssh jaiveeru-jobs@194.238.17.68" -ForegroundColor White
Write-Host "2. Navigate: cd /home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site" -ForegroundColor White  
Write-Host "3. Create directory: mkdir -p src/app" -ForegroundColor White
Write-Host "4. Move file: mv src/favicon.ico src/app/favicon.ico" -ForegroundColor White
Write-Host "5. Set permissions: chmod 644 src/app/favicon.ico" -ForegroundColor White
Write-Host "6. Test: curl -I https://jobs.jaiveeru.site/favicon.ico" -ForegroundColor White

Write-Host "`n✅ After running these commands, your favicon will work!" -ForegroundColor Green
