#!/usr/bin/env bash
# Remote-deploy: run from your DEV machine (macOS / Linux).
# SSHes into the prod PC, pulls latest, triggers 'AtivaDeploy' scheduled task,
# streams the deploy log, and health-checks the public URL.
#
# Prerequisites (one-time):
#   * SSH key in ~/.ssh/id_ed25519 + 'ativa' host alias (see docs/DEV_WORKFLOW.md)
#   * cloudflared installed locally
#   * register-deploy-task.ps1 run once as admin on the prod PC
#
# Usage:
#   ./scripts/remote-deploy.sh                 # deploy origin/main
#   ./scripts/remote-deploy.sh -b dev          # deploy a specific branch
#   ./scripts/remote-deploy.sh --skip-pull     # just re-run deploy.ps1 on current code

set -euo pipefail

SSH_HOST="ativa"
REMOTE_DIR="D:\\AI websites\\Sidharth Gold Inventory Site\\Sidharth Gold Inventory Site"
BRANCH="main"
SKIP_PULL=false
FOLLOW_SECONDS=180
PUBLIC_HEALTH="https://ativa-jewels.com/health"

while [[ $# -gt 0 ]]; do
    case "$1" in
        -b|--branch)      BRANCH="$2"; shift 2 ;;
        --skip-pull)      SKIP_PULL=true; shift ;;
        --ssh-host)       SSH_HOST="$2"; shift 2 ;;
        --follow-seconds) FOLLOW_SECONDS="$2"; shift 2 ;;
        -h|--help)
            grep -E '^#' "$0" | head -20
            exit 0
            ;;
        *) echo "unknown arg: $1"; exit 2 ;;
    esac
done

cyan()  { printf '\n\033[36m==> %s\033[0m\n' "$*"; }
ok()    { printf '    \033[32m[OK] %s\033[0m\n' "$*"; }
warn()  { printf '    \033[33m[WARN] %s\033[0m\n' "$*"; }
fail()  { printf '    \033[31m[FAIL] %s\033[0m\n' "$*"; }

cyan "Checking SSH reachability ($SSH_HOST)"
if ! hostname_out=$(ssh -o ConnectTimeout=15 -o BatchMode=yes "$SSH_HOST" 'hostname' 2>&1); then
    fail "Could not SSH to '$SSH_HOST'."
    echo "$hostname_out"
    echo
    echo "Troubleshooting:"
    echo "  1. cloudflared installed?   cloudflared --version"
    echo "  2. SSH key permissions:     chmod 600 ~/.ssh/id_ed25519"
    echo "  3. Tunnel up on prod PC?    (see docs/DEV_WORKFLOW.md)"
    exit 1
fi
ok "Connected to $hostname_out"

if [[ "$SKIP_PULL" == "false" ]]; then
    cyan "Pulling origin/$BRANCH on remote"
    # Use a heredoc to send a PowerShell script over SSH
    ssh "$SSH_HOST" "powershell -NoProfile -Command -" <<EOF
Set-Location '$REMOTE_DIR'
git fetch origin
git checkout $BRANCH
git pull --ff-only origin $BRANCH
git log -1 --oneline
EOF
    ok "Remote repo up to date"
else
    warn "Skipping git pull"
fi

cyan "Triggering remote deploy task 'AtivaDeploy'"
ssh "$SSH_HOST" "powershell -NoProfile -Command -" <<'EOF'
$t = Get-ScheduledTask -TaskName 'AtivaDeploy' -ErrorAction SilentlyContinue
if (-not $t) {
    Write-Host '[FAIL] Scheduled task AtivaDeploy not registered.' -ForegroundColor Red
    Write-Host 'Run scripts\register-deploy-task.ps1 as admin on the prod PC first.'
    exit 3
}
Add-Content -Path 'C:\ProgramData\AtivaDeploy\deploy.log' -Value ''
Add-Content -Path 'C:\ProgramData\AtivaDeploy\deploy.log' -Value ('####### REMOTE TRIGGER ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + ' #######')
schtasks /run /tn 'AtivaDeploy' | Out-Null
Write-Host '[OK] Task triggered'
EOF

cyan "Streaming deploy log (max ${FOLLOW_SECONDS}s)"
# The log is a PS 5.1 transcript (UTF-16 LE). We decode it server-side with
# Unicode encoding before sending back over SSH.
ssh "$SSH_HOST" "powershell -NoProfile -Command -" <<EOF
\$stopAt = (Get-Date).AddSeconds($FOLLOW_SECONDS)
\$lastSize = 0
\$logPath = 'C:\ProgramData\AtivaDeploy\deploy.log'
function Decode-LogChunk(\$bytes) {
    if (\$bytes.Length -ge 2 -and \$bytes[0] -eq 0xFF -and \$bytes[1] -eq 0xFE) {
        return [System.Text.Encoding]::Unicode.GetString(\$bytes)
    } elseif (\$bytes.Length -ge 3 -and \$bytes[0] -eq 0xEF -and \$bytes[1] -eq 0xBB -and \$bytes[2] -eq 0xBF) {
        return [System.Text.Encoding]::UTF8.GetString(\$bytes)
    } else {
        \$zeroes = 0
        for (\$i = 1; \$i -lt [Math]::Min(\$bytes.Length, 200); \$i += 2) {
            if (\$bytes[\$i] -eq 0) { \$zeroes++ }
        }
        if (\$zeroes -gt 50) { return [System.Text.Encoding]::Unicode.GetString(\$bytes) }
        return [System.Text.Encoding]::UTF8.GetString(\$bytes)
    }
}
while ((Get-Date) -lt \$stopAt) {
    \$t = Get-ScheduledTask -TaskName 'AtivaDeploy' -ErrorAction SilentlyContinue
    \$running = \$t -and \$t.State -eq 'Running'
    if (Test-Path \$logPath) {
        \$len = (Get-Item \$logPath).Length
        if (\$len -gt \$lastSize) {
            \$fs = [System.IO.File]::Open(\$logPath,'Open','Read','ReadWrite')
            \$fs.Seek(\$lastSize, 'Begin') | Out-Null
            \$buf = New-Object byte[] (\$len - \$lastSize)
            [void]\$fs.Read(\$buf, 0, \$buf.Length)
            \$fs.Close()
            Write-Host -NoNewline (Decode-LogChunk \$buf)
            \$lastSize = \$len
        }
    }
    if (-not \$running) { Start-Sleep -Milliseconds 500; break }
    Start-Sleep -Milliseconds 800
}
EOF

cyan "Public URL health check ($PUBLIC_HEALTH)"
if curl -sf -o /dev/null -w "%{http_code}" --max-time 15 "$PUBLIC_HEALTH" | grep -q 200; then
    ok "Public URL reachable (HTTP 200)"
else
    warn "Public URL probe failed"
fi

echo
echo "============================================================="
echo "  Remote deploy complete."
echo "============================================================="
echo "  Production web:  https://ativa-jewels.com"
echo "  Full log on prod: C:\\ProgramData\\AtivaDeploy\\deploy.log"
echo
