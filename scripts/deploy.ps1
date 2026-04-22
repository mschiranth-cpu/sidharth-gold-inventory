#Requires -RunAsAdministrator
<#
.SYNOPSIS
    One-click deploy: builds frontend + backend and restarts the NSSM production service.
.DESCRIPTION
    Run from an elevated (Admin) PowerShell prompt:
        .\scripts\deploy.ps1
    The script will:
        1. Verify you are on the 'main' branch
        2. Build the frontend (Vite)
        3. Copy the self-destructing sw.js into the dist folder
        4. Build the backend (TypeScript)
        5. Run any pending Prisma migrations
        6. Restart the NSSM service (AtivaGoldInventoryBackend)
        7. Health-check http://localhost:3000/health
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ── Configuration ──────────────────────────────────────────────────────
$ServiceName   = 'AtivaGoldInventoryBackend'
$HealthUrl     = 'http://localhost:3000/health'
$MaxRetries    = 15
$RetrySleep    = 2          # seconds between health-check retries
$ProjectRoot   = Split-Path -Parent (Split-Path -Parent $PSCommandPath)

# ── Helpers ────────────────────────────────────────────────────────────
function Write-Step  { param([string]$msg) Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Ok    { param([string]$msg) Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Warn  { param([string]$msg) Write-Host "    [WARN] $msg" -ForegroundColor Yellow }
function Write-Fail  { param([string]$msg) Write-Host "    [FAIL] $msg" -ForegroundColor Red }

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

    # ── Restart service ────────────────────────────────────────────────
    Write-Step "Restarting NSSM service '$ServiceName'"
    $svcStatus = nssm status $ServiceName 2>&1
    if ($svcStatus -match 'SERVICE_RUNNING') {
        nssm restart $ServiceName
    } else {
        nssm start $ServiceName
    }
    Write-Ok 'Service restarted'

    # ── Health check ───────────────────────────────────────────────────
    Write-Step "Health check ($HealthUrl)"
    $healthy = $false
    for ($i = 1; $i -le $MaxRetries; $i++) {
        Start-Sleep -Seconds $RetrySleep
        try {
            $resp = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 5
            if ($resp.StatusCode -eq 200) {
                $healthy = $true
                break
            }
        } catch {
            Write-Host "    Attempt $i/$MaxRetries — waiting..." -ForegroundColor DarkGray
        }
    }

    if ($healthy) {
        Write-Ok "Health check passed (HTTP 200)"
        Write-Host "`n============================================" -ForegroundColor Green
        Write-Host "  Deploy complete!  https://ativa-jewels.com" -ForegroundColor Green
        Write-Host "============================================`n" -ForegroundColor Green
    } else {
        Write-Fail "Health check failed after $MaxRetries attempts."
        Write-Warn "Check logs:  nssm status $ServiceName"
        exit 1
    }
}
finally { Pop-Location }
