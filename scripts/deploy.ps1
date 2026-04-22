#Requires -RunAsAdministrator
<#
.SYNOPSIS
    One-click deploy: builds frontend + backend, restarts NSSM, and ensures
    all supporting services (SSH, Cloudflare Tunnel) are up and healthy.
.DESCRIPTION
    Run from an elevated (Admin) PowerShell prompt:
        .\scripts\deploy.ps1
    The script will:
        1. Verify you are on the 'main' branch
        2. Build the frontend (Vite) + copy sw.js
        3. Build the backend (TypeScript)
        4. Run any pending Prisma migrations
        5. Restart the NSSM service (AtivaGoldInventoryBackend)
        6. Ensure OpenSSH Server (sshd) is running
        7. Ensure Cloudflare Tunnel is running AND connected to edge
        8. Health-check local + public endpoints
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ── Configuration ──────────────────────────────────────────────────────
$BackendSvc     = 'AtivaGoldInventoryBackend'
$SshdSvc        = 'sshd'
$TunnelSvc      = 'Cloudflared'
$TunnelName     = 'ativa-jewels-inventory'
$TunnelId       = '72d55140-d7f5-40a7-bcf3-ea2770f4bd21'
$LocalHealthUrl = 'http://localhost:3000/health'
$PublicHealthUrl= 'https://ativa-jewels.com/health'
$MaxRetries     = 15
$RetrySleep     = 2
$ProjectRoot    = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$CloudflaredExe = Join-Path ${env:ProgramFiles(x86)} 'cloudflared\cloudflared.exe'
$CloudflaredCfg = Join-Path ${env:ProgramFiles(x86)} 'cloudflared\config.yml'

# ── Helpers ────────────────────────────────────────────────────────────
function Write-Step  { param([string]$msg) Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Ok    { param([string]$msg) Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Warn  { param([string]$msg) Write-Host "    [WARN] $msg" -ForegroundColor Yellow }
function Write-Fail  { param([string]$msg) Write-Host "    [FAIL] $msg" -ForegroundColor Red }

function Ensure-Service {
    param(
        [Parameter(Mandatory)][string]$Name,
        [string]$DisplayName = $Name
    )
    $svc = Get-Service -Name $Name -ErrorAction SilentlyContinue
    if (-not $svc) {
        Write-Fail "$DisplayName service is not installed."
        return $false
    }
    if ($svc.Status -ne 'Running') {
        Write-Warn "$DisplayName is $($svc.Status). Starting..."
        try {
            Start-Service -Name $Name
            Start-Sleep 2
            $svc = Get-Service -Name $Name
        } catch {
            Write-Fail "Failed to start $DisplayName : $_"
            return $false
        }
    }
    if ($svc.Status -eq 'Running') {
        Write-Ok "$DisplayName is Running"
        return $true
    }
    Write-Fail "$DisplayName is $($svc.Status) after start attempt"
    return $false
}

function Test-TunnelConnected {
    if (-not (Test-Path $CloudflaredExe)) { return $false }
    $info = & $CloudflaredExe tunnel info $TunnelName 2>&1 | Out-String
    return ($info -notmatch 'does not have any active connection' -and $info -match 'CONNECTOR ID')
}

# ── Pre-flight checks ─────────────────────────────────────────────────
Write-Step 'Pre-flight checks'

Push-Location $ProjectRoot
try {
    $branch = git rev-parse --abbrev-ref HEAD 2>&1
    if ($branch -ne 'main') {
        Write-Fail "Current branch is '$branch'. Switch to 'main' before deploying."
        exit 1
    }
    Write-Ok "On branch 'main'"

    $dirty = git status --porcelain 2>&1
    if ($dirty) {
        Write-Warn 'Working tree has uncommitted changes — deploying current state anyway.'
    }

    # ── Build frontend ─────────────────────────────────────────────────
    Write-Step 'Building frontend (Vite)'
    Push-Location "$ProjectRoot\frontend"
    try {
        npx vite build
        if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed' }
        Write-Ok 'Frontend built'

        Copy-Item -Path "$ProjectRoot\frontend\public\sw.js" `
                  -Destination "$ProjectRoot\frontend\dist\sw.js" -Force
        Write-Ok 'sw.js copied to dist'
    }
    finally { Pop-Location }

    # ── Build backend ──────────────────────────────────────────────────
    Write-Step 'Building backend (TypeScript)'
    Push-Location "$ProjectRoot\backend"
    try {
        npm run build
        if ($LASTEXITCODE -ne 0) { throw 'Backend build failed' }
        Write-Ok 'Backend built'
    }
    finally { Pop-Location }

    # ── Prisma migrations ──────────────────────────────────────────────
    Write-Step 'Running Prisma migrations (if any)'
    Push-Location "$ProjectRoot\backend"
    try {
        npx prisma migrate deploy 2>&1 | Write-Host
        Write-Ok 'Prisma migrate deploy completed'
    }
    finally { Pop-Location }

    # ── Restart backend service ────────────────────────────────────────
    Write-Step "Restarting backend service '$BackendSvc'"
    $svcStatus = nssm status $BackendSvc 2>&1
    if ($svcStatus -match 'SERVICE_RUNNING') {
        nssm restart $BackendSvc | Out-Null
    } else {
        nssm start $BackendSvc | Out-Null
    }
    Start-Sleep 3
    Write-Ok 'Backend service restarted'

    # ── Ensure SSH server is up ────────────────────────────────────────
    Write-Step 'Ensuring OpenSSH Server is running'
    if (-not (Ensure-Service -Name $SshdSvc -DisplayName 'sshd (OpenSSH Server)')) {
        Write-Warn 'SSH server is not running — remote access will not work.'
        Write-Warn 'To install: .\scripts\setup-ssh.ps1'
    } else {
        # Ensure it is set to auto-start
        $startupType = (Get-Service $SshdSvc).StartType
        if ($startupType -ne 'Automatic') {
            Set-Service -Name $SshdSvc -StartupType Automatic
            Write-Ok 'sshd set to Automatic startup'
        }
    }

    # ── Ensure Cloudflare Tunnel is up & connected ─────────────────────
    Write-Step 'Ensuring Cloudflare Tunnel is up'
    if (-not (Ensure-Service -Name $TunnelSvc -DisplayName 'Cloudflared Tunnel')) {
        Write-Fail 'Cloudflare Tunnel service is not installed or not starting.'
        exit 1
    }

    # Ensure the service is set to auto-start
    if ((Get-Service $TunnelSvc).StartType -ne 'Automatic') {
        Set-Service -Name $TunnelSvc -StartupType Automatic
        Write-Ok 'Cloudflared set to Automatic startup'
    }

    # Verify tunnel is actually connected to Cloudflare edge
    Write-Host '    Verifying tunnel edge connections...' -ForegroundColor DarkGray
    $connected = $false
    for ($i = 1; $i -le 10; $i++) {
        if (Test-TunnelConnected) { $connected = $true; break }
        Start-Sleep 2
    }

    if (-not $connected) {
        Write-Warn 'Tunnel service running but no edge connections — attempting self-heal...'
        # Kill any stale processes and restart
        Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep 2

        # Verify config file is valid (has ingress rules)
        if (Test-Path $CloudflaredCfg) {
            $cfgContent = Get-Content $CloudflaredCfg -Raw
            if ($cfgContent -notmatch 'ingress:' -or $cfgContent -notmatch 'ativa-jewels\.com') {
                Write-Warn 'Tunnel config is missing ingress rules. Rewriting...'
                $credFile = Join-Path ${env:ProgramFiles(x86)} "cloudflared\$TunnelId.json"
                if (-not (Test-Path $credFile)) {
                    $userCred = Join-Path $env:USERPROFILE ".cloudflared\$TunnelId.json"
                    if (Test-Path $userCred) {
                        Copy-Item $userCred $credFile -Force
                        Write-Ok 'Credentials restored from user profile'
                    }
                }
                $lines = @(
                    "tunnel: $TunnelId"
                    "credentials-file: $credFile"
                    'protocol: http2'
                    "logDirectory: $(Split-Path $CloudflaredCfg)"
                    ''
                    'ingress:'
                    '  - hostname: ssh.ativa-jewels.com'
                    '    service: ssh://localhost:22'
                    '  - hostname: ativa-jewels.com'
                    '    service: http://localhost:3000'
                    '  - service: http_status:404'
                )
                $lines | Out-File -LiteralPath $CloudflaredCfg -Encoding ascii -Force
                Write-Ok 'Tunnel config rewritten'
            }
        }

        Start-Service $TunnelSvc -ErrorAction SilentlyContinue
        Start-Sleep 5
        for ($i = 1; $i -le 10; $i++) {
            if (Test-TunnelConnected) { $connected = $true; break }
            Start-Sleep 2
        }
    }

    if ($connected) {
        Write-Ok 'Cloudflare Tunnel is connected to edge'
    } else {
        Write-Fail 'Cloudflare Tunnel is running but not connecting to edge. Check logs.'
    }

    # ── Health check ───────────────────────────────────────────────────
    Write-Step "Local health check ($LocalHealthUrl)"
    $healthy = $false
    for ($i = 1; $i -le $MaxRetries; $i++) {
        try {
            $resp = Invoke-WebRequest -Uri $LocalHealthUrl -UseBasicParsing -TimeoutSec 5
            if ($resp.StatusCode -eq 200) { $healthy = $true; break }
        } catch {
            Write-Host "    Attempt $i/$MaxRetries — waiting..." -ForegroundColor DarkGray
        }
        Start-Sleep -Seconds $RetrySleep
    }

    if ($healthy) {
        Write-Ok 'Local health check passed (HTTP 200)'
    } else {
        Write-Fail "Local health check failed after $MaxRetries attempts."
        Write-Warn "Check logs:  nssm status $BackendSvc"
        exit 1
    }

    # Also probe the public URL (optional, don't fail the deploy if it can't)
    Write-Step "Public health check ($PublicHealthUrl)"
    try {
        $resp = Invoke-WebRequest -Uri $PublicHealthUrl -UseBasicParsing -TimeoutSec 10
        if ($resp.StatusCode -eq 200) {
            Write-Ok 'Public URL reachable (HTTP 200)'
        } else {
            Write-Warn "Public URL returned HTTP $($resp.StatusCode)"
        }
    } catch {
        Write-Warn "Public URL probe failed: $_"
        Write-Warn 'Tunnel may still be propagating — try https://ativa-jewels.com in 30s'
    }

    # ── Summary ────────────────────────────────────────────────────────
    Write-Host ''
    Write-Host '=============================================================' -ForegroundColor Green
    Write-Host '  Deploy complete!' -ForegroundColor Green
    Write-Host '=============================================================' -ForegroundColor Green
    Write-Host '  Production web:  https://ativa-jewels.com' -ForegroundColor Green
    Write-Host '  Remote SSH:      ssh ativa   (from configured dev machine)' -ForegroundColor Green
    Write-Host '=============================================================' -ForegroundColor Green
    Write-Host ''
    Write-Host '  Service status summary:' -ForegroundColor Cyan
    Get-Service $BackendSvc, $SshdSvc, $TunnelSvc -ErrorAction SilentlyContinue |
        Format-Table Name, Status, StartType -AutoSize | Out-String | Write-Host
}
finally { Pop-Location }
