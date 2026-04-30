# Fix Dependencies Script
# Run this script to fix corrupted node_modules

Write-Host "Cleaning npm cache..." -ForegroundColor Yellow
npm cache clean --force

Write-Host "Removing node_modules and package-lock.json..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules
    Write-Host "Removed node_modules" -ForegroundColor Green
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json
    Write-Host "Removed package-lock.json" -ForegroundColor Green
}

Write-Host "Clearing Expo cache..." -ForegroundColor Yellow
if (Test-Path ".expo") {
    Remove-Item -Recurse -Force .expo
    Write-Host "Removed .expo cache" -ForegroundColor Green
}

Write-Host "Reinstalling dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "Done! You can now run 'npm start'" -ForegroundColor Green

