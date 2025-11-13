# Get local IP address for Expo Go configuration
# Used to configure React Native app to connect to local backend

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "   Expo Go IP Configuration" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Get all IPv4 addresses from network adapters
$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | 
    Where-Object { 
        $_.IPAddress -notlike "127.*" -and 
        $_.IPAddress -notlike "169.254.*" -and
        $_.InterfaceAlias -notlike "*Loopback*"
    } | 
    Select-Object IPAddress, InterfaceAlias

if ($ipAddresses.Count -eq 0) {
    Write-Host "[ERROR] No valid local IP address found" -ForegroundColor Red
    Write-Host "        Please ensure you are connected to WiFi or hotspot" -ForegroundColor Yellow
    exit 1
}

Write-Host "Detected network interfaces:`n" -ForegroundColor Green

# Categorize IP addresses
$wifiIP = $null
$hotspotIP = $null
$ethernetIP = $null

foreach ($ip in $ipAddresses) {
    $interface = $ip.InterfaceAlias
    $address = $ip.IPAddress
    
    # WiFi connection
    if ($interface -like "*Wi-Fi*" -or $interface -like "*WLAN*") {
        if ($address -like "192.168.*" -or $address -like "10.*") {
            Write-Host "  [WiFi Router]" -ForegroundColor Cyan
            Write-Host "    Interface: $interface" -ForegroundColor Gray
            Write-Host "    IP: $address" -ForegroundColor White
            Write-Host "    Usage: Phone and PC both connect to same WiFi router`n" -ForegroundColor Yellow
            $wifiIP = $address
        }
    }
    
    # Hotspot connection
    if ($interface -like "*Local Area Connection*" -or $interface -match ".*\d+$" -or $address -like "172.20.10.*") {
        Write-Host "  [WiFi Hotspot]" -ForegroundColor Magenta
        Write-Host "    Interface: $interface" -ForegroundColor Gray
        Write-Host "    IP: $address" -ForegroundColor White
        Write-Host "    Usage: Phone connects to PC's hotspot`n" -ForegroundColor Yellow
        $hotspotIP = $address
    }
    
    # Ethernet
    if ($interface -like "*Ethernet*") {
        Write-Host "  [Wired Network]" -ForegroundColor Green
        Write-Host "    Interface: $interface" -ForegroundColor Gray
        Write-Host "    IP: $address" -ForegroundColor White
        Write-Host "    Usage: PC wired, phone on WiFi (same router)`n" -ForegroundColor Yellow
        $ethernetIP = $address
    }
    
    # Other interfaces
    if (-not ($interface -like "*Wi-Fi*" -or $interface -like "*WLAN*" -or 
              $interface -like "*Local Area Connection*" -or $interface -match ".*\d+$" -or
              $interface -like "*Ethernet*")) {
        Write-Host "  [Other] $interface" -ForegroundColor Gray
        Write-Host "    IP: $address`n" -ForegroundColor DarkGray
    }
}

# Smart recommendation
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Recommended Configuration:" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Cyan

$recommendedIP = $null
$connectionType = ""

if ($hotspotIP) {
    $recommendedIP = $hotspotIP
    $connectionType = "WiFi Hotspot"
    Write-Host "[RECOMMENDED] WiFi Hotspot Mode" -ForegroundColor Green
    Write-Host "  IP Address: $hotspotIP" -ForegroundColor White -BackgroundColor DarkGreen
    Write-Host "`n  Scenario: Phone connects to PC's hotspot" -ForegroundColor Yellow
    Write-Host "  Pros: IP is fixed, never changes" -ForegroundColor Gray
    Write-Host "  Cons: Phone cannot access internet (unless PC shares connection)`n" -ForegroundColor Gray
}

if ($wifiIP) {
    if (-not $recommendedIP) {
        $recommendedIP = $wifiIP
        $connectionType = "WiFi Router"
    }
    Write-Host "[ALTERNATIVE] WiFi Router Mode" -ForegroundColor Cyan
    Write-Host "  IP Address: $wifiIP" -ForegroundColor White
    Write-Host "`n  Scenario: Phone and PC both connect to same WiFi router" -ForegroundColor Yellow
    Write-Host "  Pros: Phone can access internet normally" -ForegroundColor Gray
    Write-Host "  Cons: IP may change (after router restart)`n" -ForegroundColor Gray
}

if ($ethernetIP -and -not $wifiIP) {
    if (-not $recommendedIP) {
        $recommendedIP = $ethernetIP
        $connectionType = "Wired Network"
    }
    Write-Host "[ALTERNATIVE] Wired + Wireless Mix" -ForegroundColor Cyan
    Write-Host "  IP Address: $ethernetIP" -ForegroundColor White
    Write-Host "`n  Scenario: PC wired, phone on router WiFi" -ForegroundColor Yellow
}

if ($recommendedIP) {
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host "Quick Setup Steps:" -ForegroundColor Green
    Write-Host "================================`n" -ForegroundColor Cyan
    
    Write-Host "1. Open file: " -NoNewline -ForegroundColor White
    Write-Host "frontend-js\services\api.js" -ForegroundColor Yellow
    
    Write-Host "`n2. Find line 22, change to:" -ForegroundColor White
    Write-Host "   const MANUAL_DEV_IP = '$recommendedIP';" -ForegroundColor Green
    
    Write-Host "`n3. Save file and restart Expo:" -ForegroundColor White
    Write-Host "   cd frontend-js" -ForegroundColor Gray
    Write-Host "   npx expo start" -ForegroundColor Gray
    
    Write-Host "`n4. Scan QR code with your phone!`n" -ForegroundColor White
    
    # Copy to clipboard
    try {
        Set-Clipboard -Value $recommendedIP
        Write-Host "[SUCCESS] IP address ($recommendedIP) copied to clipboard!" -ForegroundColor Green
    } catch {
        # Clipboard not available, ignore
    }
} else {
    Write-Host "[WARNING] Cannot determine recommended IP" -ForegroundColor Yellow
    Write-Host "          Please check your network connection" -ForegroundColor Yellow
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Tips:" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "- Hotspot mode: IP is fixed, but phone cannot access internet" -ForegroundColor Gray
Write-Host "- Router mode: Phone can access internet, but IP may change" -ForegroundColor Gray
Write-Host "- If IP changes, just run this script again`n" -ForegroundColor Gray
