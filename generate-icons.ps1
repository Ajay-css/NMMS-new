# PWA Icon Generator Script
# This script helps you generate all required PWA icon sizes

Write-Host "🎨 PWA Icon Generator" -ForegroundColor Cyan
Write-Host "=====================`n" -ForegroundColor Cyan

# Check if we have a base icon
$publicDir = "frontend\public"
$baseIcon = "$publicDir\icon-512x512.png"

if (-not (Test-Path $publicDir)) {
    New-Item -ItemType Directory -Path $publicDir -Force | Out-Null
    Write-Host "✅ Created public directory" -ForegroundColor Green
}

Write-Host "📋 Icon Generation Options:`n" -ForegroundColor Yellow

Write-Host "Option 1: Use Online Tool (Recommended)" -ForegroundColor White
Write-Host "  1. Go to: https://www.pwabuilder.com/imageGenerator" -ForegroundColor Gray
Write-Host "  2. Upload your 512x512 icon" -ForegroundColor Gray
Write-Host "  3. Download the generated icons" -ForegroundColor Gray
Write-Host "  4. Extract to frontend/public/ folder`n" -ForegroundColor Gray

Write-Host "Option 2: Use Placeholder Icons (Quick Test)" -ForegroundColor White
Write-Host "  I can create simple colored placeholder icons for testing`n" -ForegroundColor Gray

Write-Host "Option 3: Manual Creation" -ForegroundColor White
Write-Host "  Create icons manually using image editor`n" -ForegroundColor Gray

$choice = Read-Host "Choose option (1, 2, or 3)"

if ($choice -eq "2") {
    Write-Host "`n🎨 Creating placeholder icons..." -ForegroundColor Cyan
    
    # Create a simple SVG icon and convert to PNG using PowerShell
    $sizes = @(72, 96, 128, 144, 152, 192, 384, 512)
    
    foreach ($size in $sizes) {
        $svgContent = @"
<svg width="$size" height="$size" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6366f1;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="$($size/2)" cy="$($size/2)" r="$($size/2)" fill="url(#grad)" />
  <text x="50%" y="50%" font-family="Arial" font-size="$($size/2)" fill="white" text-anchor="middle" dy=".3em">📄</text>
</svg>
"@
        $svgPath = "$publicDir\icon-$size`x$size.svg"
        $svgContent | Out-File -FilePath $svgPath -Encoding UTF8
        Write-Host "  ✅ Created icon-$size`x$size.svg" -ForegroundColor Green
    }
    
    Write-Host "`n⚠️  Note: SVG icons created. For better compatibility:" -ForegroundColor Yellow
    Write-Host "  - Convert SVGs to PNG using an online tool" -ForegroundColor Gray
    Write-Host "  - Or use Option 1 for production-ready icons`n" -ForegroundColor Gray
    
} elseif ($choice -eq "1") {
    Write-Host "`n🌐 Opening PWA Builder Image Generator..." -ForegroundColor Cyan
    Start-Process "https://www.pwabuilder.com/imageGenerator"
    Write-Host "✅ Browser opened. Follow the steps above.`n" -ForegroundColor Green
    
} else {
    Write-Host "`n📝 Manual creation selected." -ForegroundColor Cyan
    Write-Host "Create these icon sizes in frontend/public/:" -ForegroundColor White
    Write-Host "  - icon-72x72.png" -ForegroundColor Gray
    Write-Host "  - icon-96x96.png" -ForegroundColor Gray
    Write-Host "  - icon-128x128.png" -ForegroundColor Gray
    Write-Host "  - icon-144x144.png" -ForegroundColor Gray
    Write-Host "  - icon-152x152.png" -ForegroundColor Gray
    Write-Host "  - icon-192x192.png" -ForegroundColor Gray
    Write-Host "  - icon-384x384.png" -ForegroundColor Gray
    Write-Host "  - icon-512x512.png`n" -ForegroundColor Gray
}

Write-Host "`n📱 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Place all icon PNG files in frontend/public/" -ForegroundColor White
Write-Host "  2. Run: cd frontend && npm run build" -ForegroundColor White
Write-Host "  3. Run: npm run preview" -ForegroundColor White
Write-Host "  4. Test PWA installation on your device`n" -ForegroundColor White

Write-Host "✨ PWA setup is complete! Check PWA_SETUP.md for details.`n" -ForegroundColor Green
