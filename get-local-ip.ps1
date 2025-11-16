# -*- coding: utf-8 -*-
# Get local IP address and configure Expo frontend automatically
# For Expo Go mobile connection to backend

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Expo Go Network Config Tool" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Get all IPv4 addresses
$adapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -notlike "127.*" -and 
    $_.IPAddress -notlike "169.254.*"
}

if ($adapters.Count -eq 0) {
    Write-Host "ERROR: No available network interfaces found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please ensure:" -ForegroundColor Yellow
    Write-Host "  1. WiFi is connected" -ForegroundColor Yellow
    Write-Host "  2. Or Mobile Hotspot is enabled" -ForegroundColor Yellow
    exit 1
}

Write-Host "Found network interfaces:" -ForegroundColor Green
Write-Host ""

$index = 1
$ipList = @()

foreach ($adapter in $adapters) {
    $ip = $adapter.IPAddress
    $interfaceAlias = (Get-NetIPAddress -IPAddress $ip).InterfaceAlias
    
    # Determine network type
    $type = "Unknown"
    $emoji = "?"
    $recommended = ""
    
    if ($ip -like "172.20.10.*") {
        $type = "Mobile Hotspot"
        $emoji = "[HOTSPOT]"
        $recommended = " <- RECOMMENDED"
    }
    elseif ($ip -like "192.168.*") {
        $type = "WiFi Router"
        $emoji = "[WiFi]"
        $recommended = " <- RECOMMENDED"
    }
    elseif ($ip -like "172.28.*" -or $ip -like "172.16.*") {
        $type = "Virtual NIC (WSL/Docker)"
        $emoji = "[Virtual]"
        $recommended = " <- WARNING: Mobile cannot access"
    }
    elseif ($ip -like "10.*") {
        $type = "Enterprise Network"
        $emoji = "[Enterprise]"
    }
    
    Write-Host "[$index] $emoji $ip" -ForegroundColor White
    Write-Host "    Interface: $interfaceAlias" -ForegroundColor Gray
    Write-Host "    Type: $type$recommended" -ForegroundColor Gray
    Write-Host ""
    
    $ipList += @{
        Index = $index
        IP = $ip
        Interface = $interfaceAlias
        Type = $type
        IsRecommended = ($recommended -ne "")
    }
    
    $index++
}

# Auto-select recommended IP
$recommendedIp = ($ipList | Where-Object { $_.IsRecommended })[0]

if ($recommendedIp) {
    $selectedIp = $recommendedIp.IP
    Write-Host "RECOMMENDED: $selectedIp ($($recommendedIp.Type))" -ForegroundColor Green
}
else {
    $selectedIp = $ipList[0].IP
    Write-Host "AUTO-SELECTED: $selectedIp" -ForegroundColor Yellow
    Write-Host "   (No recommended IP found, please verify mobile can access this address)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "To select different IP, enter number [1-$($ipList.Count)], or press Enter to use recommended:" -ForegroundColor Cyan -NoNewline
$choice = Read-Host " "

if ($choice -match '^\d+$' -and [int]$choice -ge 1 -and [int]$choice -le $ipList.Count) {
    $selectedIp = $ipList[[int]$choice - 1].IP
    Write-Host "Selected: $selectedIp" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Configuring..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Read api.js file
$apiFilePath = "frontend-js\services\api.js"

if (-not (Test-Path $apiFilePath)) {
    Write-Host "ERROR: File not found: $apiFilePath" -ForegroundColor Red
    Write-Host "   Please run this script from project root directory" -ForegroundColor Yellow
    exit 1
}

$content = Get-Content $apiFilePath -Raw -Encoding UTF8

# Modify configuration
# 1. Enable manual IP
$content = $content -replace 'const USE_MANUAL_IP = false;', 'const USE_MANUAL_IP = true;'

# 2. Update IP address
$content = $content -replace "const MANUAL_DEV_IP = '[0-9.]+';", "const MANUAL_DEV_IP = '$selectedIp';"

# Save file
$content | Set-Content $apiFilePath -Encoding UTF8 -NoNewline

Write-Host "SUCCESS! Configuration complete" -ForegroundColor Green
Write-Host ""
Write-Host "Updated file: $apiFilePath" -ForegroundColor White
Write-Host "   USE_MANUAL_IP = true" -ForegroundColor Gray
Write-Host "   MANUAL_DEV_IP = '$selectedIp'" -ForegroundColor Gray
Write-Host ""

# Copy IP to clipboard
Set-Clipboard -Value $selectedIp
Write-Host "IP address copied to clipboard: $selectedIp" -ForegroundColor Cyan
Write-Host ""

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Next Steps" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start backend server:" -ForegroundColor Yellow
Write-Host "    cd backend" -ForegroundColor White
Write-Host "    npm start" -ForegroundColor White
Write-Host ""
Write-Host "2. Start Expo dev server:" -ForegroundColor Yellow
Write-Host "    cd frontend-js" -ForegroundColor White
Write-Host "    npx expo start" -ForegroundColor White
Write-Host ""
Write-Host "3. Scan QR code with your phone" -ForegroundColor Yellow
Write-Host ""
Write-Host "Ensure phone and computer are on same network:" -ForegroundColor Cyan
if ($selectedIp -like "172.20.10.*") {
    Write-Host "   -> Phone connects to computer's mobile hotspot" -ForegroundColor White
}
elseif ($selectedIp -like "192.168.*") {
    Write-Host "   -> Phone and computer connect to same WiFi" -ForegroundColor White
}
Write-Host ""
Write-Host "Happy coding!" -ForegroundColor Green
Write-Host ""
