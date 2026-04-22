# Resets PostgreSQL 'postgres' superuser password to 'postgres123'
# Must run as Administrator.
param(
    [string]$NewPassword = 'postgres123'
)

$ErrorActionPreference = 'Stop'

$dataDir = 'C:\Program Files\PostgreSQL\16\data'
$hba = Join-Path $dataDir 'pg_hba.conf'
$backup = "$hba.backup_reset"
$logPath = Join-Path $env:TEMP 'pg-reset.log'

function Log($m) { Add-Content $logPath "[$(Get-Date -f s)] $m"; Write-Host $m }

try {
    if (Test-Path $logPath) { Remove-Item $logPath -Force }
    Log "Reset started. Data dir: $dataDir"

    Log "Backing up pg_hba.conf"
    Copy-Item $hba $backup -Force

    Log "Setting local/host auth to 'trust' temporarily"
    $content = Get-Content $hba
    $modified = foreach ($line in $content) {
        if ($line -match '^\s*#' -or $line.Trim() -eq '') {
            $line
        } elseif ($line -match '^\s*(host|hostssl|local|hostnossl)\b') {
            ($line -replace '(scram-sha-256|md5|password|ident|peer|gss|sspi|cert|reject)\s*$', 'trust')
        } else {
            $line
        }
    }
    $modified | Set-Content $hba -Encoding ASCII

    Log "Restarting PostgreSQL service"
    Restart-Service postgresql-x64-16 -Force
    Start-Sleep -Seconds 4

    Log "Changing postgres password"
    $env:PGPASSWORD = ''
    $psql = 'C:\Program Files\PostgreSQL\16\bin\psql.exe'
    & $psql -U postgres -h localhost -d postgres -c "ALTER USER postgres WITH PASSWORD '$NewPassword';"
    if ($LASTEXITCODE -ne 0) { throw "psql ALTER USER failed (exit $LASTEXITCODE)" }

    Log "Password changed. Restoring pg_hba.conf"
    Copy-Item $backup $hba -Force
    Remove-Item $backup -Force

    Log "Restarting PostgreSQL service"
    Restart-Service postgresql-x64-16 -Force
    Start-Sleep -Seconds 3

    Log "Verifying new password"
    $env:PGPASSWORD = $NewPassword
    & $psql -U postgres -h localhost -d postgres -c "SELECT 'ok';" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Verification failed (exit $LASTEXITCODE)" }

    Log "SUCCESS: postgres password is now '$NewPassword'"
    exit 0
} catch {
    Log "ERROR: $_"
    if (Test-Path $backup) {
        Log "Restoring pg_hba.conf from backup"
        Copy-Item $backup $hba -Force
        Remove-Item $backup -Force
        Restart-Service postgresql-x64-16 -Force
    }
    exit 1
}
