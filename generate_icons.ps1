Add-Type -AssemblyName System.Drawing

function Draw-CampusLogo([int]$size, [bool]$isRound) {
    $bmp = New-Object System.Drawing.Bitmap ($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Background gradient: Deep Navy #101B62 to Royal Indigo #2E1065
    $p1 = New-Object System.Drawing.PointF (0, 0)
    $p2 = New-Object System.Drawing.PointF ($size, $size)
    $c1 = [System.Drawing.Color]::FromArgb(255, 16, 27, 98)
    $c2 = [System.Drawing.Color]::FromArgb(255, 67, 40, 189)
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush ($p1, $p2, $c1, $c2)

    if ($isRound) {
        $g.FillEllipse($bgBrush, 0, 0, $size, $size)
    } else {
        # Modern squircle / rounded rectangle
        $radius = [float]($size * 0.22)
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $d = $radius * 2
        $path.AddArc(0, 0, $d, $d, 180, 90)
        $path.AddArc($size - $d, 0, $d, $d, 270, 90)
        $path.AddArc($size - $d, $size - $d, $d, $d, 0, 90)
        $path.AddArc(0, $size - $d, $d, $d, 90, 90)
        $path.CloseFigure()
        $g.FillPath($bgBrush, $path)
        $path.Dispose()
    }
    $bgBrush.Dispose()

    # Scale factor from 64x64 SVG coordinates to target
    $innerSize = [float]($size * 0.72)
    $scale = $innerSize / 64.0
    $ox = [float](($size - $innerSize) / 2.0)
    $oy = [float](($size - $innerSize) / 2.0 + ($size * 0.02))

    # 1. Graduation Cap (Top)
    $capP1 = New-Object System.Drawing.PointF (($ox + 12.0*$scale), ($oy + 4.0*$scale))
    $capP2 = New-Object System.Drawing.PointF (($ox + 52.0*$scale), ($oy + 24.0*$scale))
    $capC1 = [System.Drawing.Color]::FromArgb(255, 96, 56, 237)   # #6038ED
    $capC2 = [System.Drawing.Color]::FromArgb(255, 139, 92, 246)  # #8B5CF6
    $capBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush ($capP1, $capP2, $capC1, $capC2)
    
    $capPoints = @(
        (New-Object System.Drawing.PointF (($ox + 32.0*$scale), ($oy + 5.0*$scale))),
        (New-Object System.Drawing.PointF (($ox + 55.0*$scale), ($oy + 14.0*$scale))),
        (New-Object System.Drawing.PointF (($ox + 32.0*$scale), ($oy + 23.0*$scale))),
        (New-Object System.Drawing.PointF (($ox + 9.0*$scale),  ($oy + 14.0*$scale)))
    )
    $g.FillPolygon($capBrush, $capPoints)
    $capBrush.Dispose()

    # 2. Cap Tassel (Vibrant Teal #19B99A)
    $tealColor = [System.Drawing.Color]::FromArgb(255, 25, 185, 154)
    $tealPen = New-Object System.Drawing.Pen ($tealColor, [float](3.2 * $scale))
    $tealPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $tealPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($tealPen, [float]($ox + 13.0*$scale), [float]($oy + 15.5*$scale), [float]($ox + 13.0*$scale), [float]($oy + 26.0*$scale))
    $tealPen.Dispose()

    $tealBrush = New-Object System.Drawing.SolidBrush ($tealColor)
    $beadR = [float](2.8 * $scale)
    $g.FillEllipse($tealBrush, [float]($ox + 13.0*$scale - $beadR), [float]($oy + 27.5*$scale - $beadR), [float]($beadR * 2), [float]($beadR * 2))
    $tealBrush.Dispose()

    # 3. Shield
    $shieldPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $shieldPath.AddLine([float]($ox + 32.0*$scale), [float]($oy + 17.0*$scale), [float]($ox + 52.0*$scale), [float]($oy + 24.5*$scale))
    $shieldPath.AddLine([float]($ox + 52.0*$scale), [float]($oy + 24.5*$scale), [float]($ox + 52.0*$scale), [float]($oy + 41.5*$scale))
    $shieldPath.AddBezier(
        [float]($ox + 52.0*$scale), [float]($oy + 41.5*$scale),
        [float]($ox + 43.2*$scale), [float]($oy + 48.2*$scale),
        [float]($ox + 38.0*$scale), [float]($oy + 53.0*$scale),
        [float]($ox + 32.0*$scale), [float]($oy + 59.0*$scale)
    )
    $shieldPath.AddBezier(
        [float]($ox + 32.0*$scale), [float]($oy + 59.0*$scale),
        [float]($ox + 26.0*$scale), [float]($oy + 53.0*$scale),
        [float]($ox + 20.8*$scale), [float]($oy + 48.2*$scale),
        [float]($ox + 12.0*$scale), [float]($oy + 41.5*$scale)
    )
    $shieldPath.AddLine([float]($ox + 12.0*$scale), [float]($oy + 41.5*$scale), [float]($ox + 12.0*$scale), [float]($oy + 24.5*$scale))
    $shieldPath.CloseFigure()

    $shieldP1 = New-Object System.Drawing.PointF (($ox + 8.0*$scale), ($oy + 16.0*$scale))
    $shieldP2 = New-Object System.Drawing.PointF (($ox + 56.0*$scale), ($oy + 60.0*$scale))
    $shieldC1 = [System.Drawing.Color]::FromArgb(255, 22, 33, 90)
    $shieldC2 = [System.Drawing.Color]::FromArgb(255, 96, 56, 237)
    $shieldBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush ($shieldP1, $shieldP2, $shieldC1, $shieldC2)
    $g.FillPath($shieldBrush, $shieldPath)
    $shieldBrush.Dispose()

    $shieldBorderPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(100, 255, 255, 255), [float](1.4 * $scale))
    $g.DrawPath($shieldBorderPen, $shieldPath)
    $shieldBorderPen.Dispose()
    $shieldPath.Dispose()

    # 4. White Letter "C" cutout
    $whiteColor = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)
    $cPen = New-Object System.Drawing.Pen ($whiteColor, [float](5.6 * $scale))
    $cPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $cPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $cRect = New-Object System.Drawing.RectangleF ([float]($ox + 21.5*$scale), [float]($oy + 26.5*$scale), [float](21.0*$scale), [float](21.0*$scale))
    $g.DrawArc($cPen, $cRect, [float]38, [float]284)
    $cPen.Dispose()

    $g.Dispose()
    return $bmp
}

# 1. High-resolution App Logo (512x512)
$logo512 = Draw-CampusLogo 512 $false
$logo512.Save("C:\campus-com\campus-logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$logo512.Save("C:\Users\UESR\.gemini\antigravity\brain\622aaa1f-1a0a-48a1-8a4e-5400b026e0cb\campus-logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$logo512.Dispose()

# 2. Splash Screen Logos
$splashSizes = @{
    "drawable-mdpi" = 256
    "drawable-hdpi" = 384
    "drawable-xhdpi" = 512
    "drawable-xxhdpi" = 768
    "drawable-xxxhdpi" = 1024
}
foreach ($folder in $splashSizes.Keys) {
    $s = $splashSizes[$folder]
    $img = Draw-CampusLogo $s $false
    $targetDir = "C:\campus-com\apps\mobile\android\app\src\main\res\$folder"
    if (!(Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }
    $img.Save("$targetDir\splashscreen_logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $img.Dispose()
}

# 3. Android Mipmap Icons
$mipmapSizes = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

foreach ($folder in $mipmapSizes.Keys) {
    $px = $mipmapSizes[$folder]
    $targetDir = "C:\campus-com\apps\mobile\android\app\src\main\res\$folder"
    if (!(Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }

    # Squircle icon
    $sq = Draw-CampusLogo $px $false
    # Save as PNG first, and if webp exists, overwrite it
    $sq.Save("$targetDir\ic_launcher.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $sq.Dispose()

    # Round icon
    $rd = Draw-CampusLogo $px $true
    $rd.Save("$targetDir\ic_launcher_round.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $rd.Dispose()
}

Write-Output "ICONS_GENERATED_SUCCESSFULLY"
