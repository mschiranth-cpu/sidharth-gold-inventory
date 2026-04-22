<#
.SYNOPSIS
    Remote-deploy: run this from your DEV machine. It SSHes into the production
    PC, pulls latest git, triggers the 'AtivaDeploy' scheduled task, and streams
    the deploy log back to your terminal.

.DESCRIPTION
    Prerequisites (one-time):
      * SSH key set up in ~/.ssh/id_ed25519 + 'ativa' host alias (see docs/DEV_WORKFLOW.md)
      * cloudflared installed locally (used by SSH's ProxyCommand)
      * On the prod PC: scripts\register-deploy-task.ps1 has been run once as admin

    Usage:
        .\scripts\remote-deploy.ps1               # deploys origin/main
        .\scripts\remote-deploy.ps1 -Branch dev   # deploys a specific branch
        .\scripts\remote-deploy.ps1 -SkipPull     # skip git pull, just re-deploy current code

.EXAMPLE
    .\scripts\remote-deploy.ps1
#>
[CmdletBinding()]
param(
    [string]$SshHost   = 'ativa',
    [string]$RemoteDir = 'D:\AI websites\Sidharth Gold Inventory Site\Sidharth Gold Inventory Site',
    [string]$Branch    = 'main',
    [switch]$SkipPull,
    [int]$FollowSeconds = 180,
    [string]$PublicHealthUrl = 'https://ativa-jewels.com/health'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step { param($msg) Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Ok   { param($msg) Write-Host "    [OK] $msg"  -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "    [WARN] $msg" -ForegroundColor Yellow }
function Write-Fail { param($msg) Write-Host "    [FAIL] $msg" -ForegroundColor Red }

# ---- Sanity: can we reach the server? ----
Write-Step "Checking SSH reachability ($SshHost)"
$hostname = ssh -o ConnectTimeout=15 -o BatchMode=yes $SshHost 'hostname' 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Could not SSH to '$SshHost'."
    Write-Host $hostname
    Write-Host ''
    Write-Host 'Troubleshooting:' -ForegroundColor Yellow
    Write-Host '  1. Is cloudflared installed locally?   cloudflared --version'
    Write-Host '  2. Is your SSH key at ~/.ssh/id_ed25519 with correct permissions?'
    Write-Host '  3. Is the tunnel service running on the prod PC?'
    Write-Host '     (see docs/DEV_WORKFLOW.md for details)'
    exit 1
}
Write-Ok "Connected to $hostname"

# ---- Pull latest code on the server ----
if (-not $SkipPull) {
    Write-Step "Pulling origin/$Branch on remote"
    $pullCmd = @"
Set-Location '$RemoteDir'
git fetch origin
git checkout $Branch
git pull --ff-only origin $Branch
git log -1 --oneline
"@
    # We wrap the command in a single string for ssh; quote handling is fragile
    # otherwise. Use pwsh-on-remote via powershell.exe -Command.
    $encoded = [Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes($pullCmd))
    ssh $SshHost "powershell -NoProfile -EncodedCommand $encoded"
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Remote git pull failed (exit $LASTEXITCODE)"
        exit 1
    }
    Write-Ok 'Remote repo up to date'
} else {
    Write-Warn 'Skipping git pull (-SkipPull specified)'
}

# ---- Trigger the deploy scheduled task ----
Write-Step "Triggering remote deploy task 'AtivaDeploy'"
$logPath = 'C:\ProgramData\AtivaDeploy\deploy.log'
$triggerCmd = @"
`$t = Get-ScheduledTask -TaskName 'AtivaDeploy' -ErrorAction SilentlyContinue
if (-not `$t) {
    Write-Host '[FAIL] Scheduled task AtivaDeploy not registered.' -ForegroundColor Red
    Write-Host 'Run scripts\register-deploy-task.ps1 as admin on the prod PC first.'
    exit 3
}
# Mark a clear boundary in the log so we can read only this run's output
Add-Content -Path '$logPath' -Value ''
Add-Content -Path '$logPath' -Value ('####### REMOTE TRIGGER ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + ' #######')
schtasks /run /tn 'AtivaDeploy' | Out-Null
Write-Host '[OK] Task triggered'
"@
$encoded = [Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes($triggerCmd))
ssh $SshHost "powershell -NoProfile -EncodedCommand $encoded"
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Trigger failed (exit $LASTEXITCODE)"
    exit 1
}

# ---- Stream the log until task completes ----
# The deploy log is a PS 5.1 transcript (UTF-16 LE), so we decode with Unicode
# before writing back. We auto-detect the encoding from the BOM so this still
# works if someone swaps in a UTF-8 log.
Write-Step "Streaming deploy log (max ${FollowSeconds}s)"
$followCmd = @"
`$stopAt = (Get-Date).AddSeconds($FollowSeconds)
`$lastSize = 0
function Decode-LogChunk(`$bytes) {
    if (`$bytes.Length -ge 2 -and `$bytes[0] -eq 0xFF -and `$bytes[1] -eq 0xFE) {
        return [System.Text.Encoding]::Unicode.GetString(`$bytes)
    } elseif (`$bytes.Length -ge 3 -and `$bytes[0] -eq 0xEF -and `$bytes[1] -eq 0xBB -and `$bytes[2] -eq 0xBF) {
        return [System.Text.Encoding]::UTF8.GetString(`$bytes)
    } else {
        # Guess: transcripts are Unicode on PS 5.1. If every other byte is 0, it's UTF-16.
        `$zeroes = 0
        for (`$i = 1; `$i -lt [Math]::Min(`$bytes.Length, 200); `$i += 2) {
            if (`$bytes[`$i] -eq 0) { `$zeroes++ }
        }
        if (`$zeroes -gt 50) { return [System.Text.Encoding]::Unicode.GetString(`$bytes) }
        return [System.Text.Encoding]::UTF8.GetString(`$bytes)
    }
}
while ((Get-Date) -lt `$stopAt) {
    `$t = Get-ScheduledTask -TaskName 'AtivaDeploy' -ErrorAction SilentlyContinue
    `$running = `$t -and `$t.State -eq 'Running'
    if (Test-Path '$logPath') {
        `$len = (Get-Item '$logPath').Length
        if (`$len -gt `$lastSize) {
            `$fs = [System.IO.File]::Open('$logPath','Open','Read','ReadWrite')
            `$fs.Seek(`$lastSize, 'Begin') | Out-Null
            `$buf = New-Object byte[] (`$len - `$lastSize)
            [void]`$fs.Read(`$buf, 0, `$buf.Length)
            `$fs.Close()
            `$chunk = Decode-LogChunk `$buf
            Write-Host -NoNewline `$chunk
            `$lastSize = `$len
        }
    }
    if (-not `$running) {
        Start-Sleep -Milliseconds 500
        break
    }
    Start-Sleep -Milliseconds 800
}
"@
$encoded = [Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes($followCmd))
ssh $SshHost "powershell -NoProfile -EncodedCommand $encoded"

# ---- Final public health check from the dev machine ----
Write-Step "Public URL health check ($PublicHealthUrl)"
try {
    $resp = Invoke-WebRequest -Uri $PublicHealthUrl -UseBasicParsing -TimeoutSec 15
    if ($resp.StatusCode -eq 200) {
        Write-Ok "Public URL reachable (HTTP 200)"
    } else {
        Write-Warn "Public URL returned HTTP $($resp.StatusCode)"
    }
} catch {
    Write-Warn "Public URL probe failed: $_"
}

Write-Host ''
Write-Host '=============================================================' -ForegroundColor Green
Write-Host '  Remote deploy complete.' -ForegroundColor Green
Write-Host '=============================================================' -ForegroundColor Green
Write-Host "  Production web:  https://ativa-jewels.com"
Write-Host "  Full log on prod: $logPath"
Write-Host ''
