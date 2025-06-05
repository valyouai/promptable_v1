# ⚙ Valentelligent Kernel Dev Reset Utility v1
# ------------------------------------------------
# SAFE FULL CLEAN for Next.js Cognitive Kernel
# Author: Valentino's AI Kernel Architect
# ------------------------------------------------

Write-Host "🚀 Starting full Kernel reset procedure..." -ForegroundColor Cyan

# Ensure we're at project root
$projectRoot = Get-Location
Write-Host "📍 Project root: $projectRoot" -ForegroundColor Yellow

# Function: Safe delete helper
function SafeDelete($path) {
    if (Test-Path $path) {
        Write-Host "🧹 Deleting: $path" -ForegroundColor Magenta
        Remove-Item -Recurse -Force $path
    } else {
        Write-Host "✅ Not found (already clean): $path" -ForegroundColor Green
    }
}

# Delete build + cache folders
SafeDelete ".next"
SafeDelete "dist"
SafeDelete "node_modules"
SafeDelete "package-lock.json"

# Clean global npm cache
Write-Host "🧹 Cleaning npm cache..." -ForegroundColor Magenta
npm cache clean --force

# Reinstall dependencies
Write-Host "📦 Running fresh npm install..." -ForegroundColor Cyan
npm install

Write-Host "✅ Kernel reset complete. Fresh build environment ready." -ForegroundColor Green
Write-Host "👉 You may now run: npm run dev" -ForegroundColor Cyan 