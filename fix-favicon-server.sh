#!/bin/bash
# Quick fix script for favicon 404 on production server

echo "🔧 Fixing favicon 404 on production server..."

# Connect to server and fix favicon location
ssh jaiveeru-jobs@194.238.17.68 << 'EOF'
    echo "📁 Navigating to site directory..."
    cd /home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site
    
    echo "📋 Checking current file structure..."
    echo "Files in src/:"
    ls -la src/ | grep favicon || echo "No favicon in src/"
    
    echo "Files in src/app/:"
    ls -la src/app/ | grep favicon || echo "No favicon in src/app/"
    
    echo "🔄 Creating correct directory structure..."
    mkdir -p src/app
    
    if [ -f "src/favicon.ico" ]; then
        echo "📦 Moving favicon from src/ to src/app/..."
        mv src/favicon.ico src/app/favicon.ico
        echo "✅ Favicon moved successfully!"
    else
        echo "❌ Favicon not found in src/ directory"
        echo "📋 Available files in src/:"
        ls -la src/
    fi
    
    echo "🔍 Verifying final location..."
    if [ -f "src/app/favicon.ico" ]; then
        echo "✅ Favicon is now correctly located at src/app/favicon.ico"
        ls -la src/app/favicon.ico
    else
        echo "❌ Favicon still not in correct location"
    fi
    
    echo "🔄 Setting correct permissions..."
    chmod 644 src/app/favicon.ico 2>/dev/null || echo "File not found for permission setting"
    
    echo "🎯 Testing favicon URL..."
    curl -I https://jobs.jaiveeru.site/favicon.ico | head -1
    
EOF

echo "🚀 Fix complete! Check https://jobs.jaiveeru.site/favicon.ico"
