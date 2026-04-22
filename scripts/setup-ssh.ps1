#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Sets up OpenSSH Server on this Windows PC with key-based auth
    and routes it through the existing Cloudflare Tunnel.
.DESCRIPTION
    Right-click this file -> "Run with PowerShell" (as Admin), or from
    an elevated prompt:  powershell -ExecutionPolicy Bypass -File .\scripts\setup-ssh.ps1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step  { param([string]$msg) Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Ok    { param([string]$msg) Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Warn  { param([string]$msg) Write-Host "    [WARN] $msg" -ForegroundColor Yellow }
function Write-Fail  { param([string]$msg) Write-Host "    [FAIL] $msg" -ForegroundColor Red }

# =====================================================================
# STEP 1: Install OpenSSH Server
# =====================================================================
Write-Step 'Step 1: Installing OpenSSH Server'

$sshdExists = Get-Command sshd.exe -ErrorAction SilentlyContinue
$sshdSvc    = Get-Service sshd -ErrorAction SilentlyContinue

if ($sshdExists -and $sshdSvc) {
    Write-Ok 'OpenSSH Server is already installed'
} else {
    Write-Host '    Installing via winget (faster than DISM)...'
    winget install Microsoft.OpenSSH.Preview --accept-package-agreements --accept-source-agreements 2>&1 |
        ForEach-Object { Write-Host "    $_" }

    # winget installs to C:\Program Files\OpenSSH -- register the service
    $installDir = 'C:\Program Files\OpenSSH'
    if (-not (Test-Path "$installDir\sshd.exe")) {
        # Fallback: try the built-in Windows capability
        Write-Warn 'winget install did not place sshd.exe, trying DISM fallback...'
        dism /Online /Add-Capability /CapabilityName:OpenSSH.Server~~~~0.0.1.0 /NoRestart
        $installDir = 'C:\Windows\System32\OpenSSH'
    }

    # Ensure PATH includes the install directory
    $machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    if ($machinePath -notlike "*$installDir*") {
        [Environment]::SetEnvironmentVariable('Path', "$machinePath;$installDir", 'Machine')
        $env:Path = "$env:Path;$installDir"
    }

    # Register sshd service if not already present
    $sshdSvc = Get-Service sshd -ErrorAction SilentlyContinue
    if (-not $sshdSvc) {
        & "$installDir\install-sshd.ps1" 2>&1 | ForEach-Object { Write-Host "    $_" }
    }
    Write-Ok 'OpenSSH Server installed'
}

# Start and auto-start sshd
Set-Service -Name sshd -StartupType Automatic
Start-Service sshd -ErrorAction SilentlyContinue
Write-Ok 'sshd service set to Automatic and started'

# Set default shell to PowerShell
$regPath = 'HKLM:\SOFTWARE\OpenSSH'
if (-not (Test-Path $regPath)) { New-Item -Path $regPath -Force | Out-Null }
$pwshPath = (Get-Command powershell.exe).Source
Set-ItemProperty -Path $regPath -Name DefaultShell -Value $pwshPath -Force
Write-Ok "Default shell set to $pwshPath"

# =====================================================================
# STEP 2: SSH Key Authentication
# =====================================================================
Write-Step 'Step 2: Configuring SSH key authentication'

$sshDir = "$env:USERPROFILE\.ssh"
$keyFile = "$sshDir\id_ed25519"

if (-not (Test-Path $sshDir)) {
    New-Item -ItemType Directory -Path $sshDir -Force | Out-Null
    Write-Ok "Created $sshDir"
}

# Generate key pair if none exists
if (-not (Test-Path $keyFile)) {
    ssh-keygen -t ed25519 -f $keyFile -N '""' -C "admin@ativa-jewels-server"
    Write-Ok "Generated ED25519 key pair at $keyFile"
} else {
    Write-Ok "SSH key already exists at $keyFile"
}

# For admin users, Windows requires the key in a special location
$adminKeysFile = 'C:\ProgramData\ssh\administrators_authorized_keys'
$pubKey = Get-Content "$keyFile.pub"

if (Test-Path $adminKeysFile) {
    $existing = Get-Content $adminKeysFile -Raw
    if ($existing -notmatch [regex]::Escape($pubKey)) {
        Add-Content -Path $adminKeysFile -Value $pubKey
        Write-Ok 'Public key appended to administrators_authorized_keys'
    } else {
        Write-Ok 'Public key already present in administrators_authorized_keys'
    }
} else {
    Set-Content -Path $adminKeysFile -Value $pubKey
    Write-Ok "Created $adminKeysFile with public key"
}

# Fix ACL on administrators_authorized_keys (only SYSTEM and Administrators)
$acl = Get-Acl $adminKeysFile
$acl.SetAccessRuleProtection($true, $false)  # disable inheritance
$acl.Access | ForEach-Object { $acl.RemoveAccessRule($_) } | Out-Null
$sysRule   = New-Object System.Security.AccessControl.FileSystemAccessRule('SYSTEM','FullControl','Allow')
$adminRule = New-Object System.Security.AccessControl.FileSystemAccessRule('BUILTIN\Administrators','FullControl','Allow')
$acl.AddAccessRule($sysRule)
$acl.AddAccessRule($adminRule)
Set-Acl -Path $adminKeysFile -AclObject $acl
Write-Ok 'ACL fixed on administrators_authorized_keys (SYSTEM + Administrators only)'

# Also put in normal authorized_keys for non-admin fallback
$userKeysFile = "$sshDir\authorized_keys"
if (-not (Test-Path $userKeysFile)) {
    Copy-Item "$keyFile.pub" $userKeysFile
    Write-Ok "Copied public key to $userKeysFile"
} else {
    $existing = Get-Content $userKeysFile -Raw
    if ($existing -notmatch [regex]::Escape($pubKey)) {
        Add-Content -Path $userKeysFile -Value $pubKey
    }
    Write-Ok "authorized_keys already exists at $userKeysFile"
}

# Update sshd_config
$sshdConfig = 'C:\ProgramData\ssh\sshd_config'
$config = Get-Content $sshdConfig -Raw

# Enable PubkeyAuthentication
if ($config -match '#?\s*PubkeyAuthentication\s+\w+') {
    $config = $config -replace '#?\s*PubkeyAuthentication\s+\w+', 'PubkeyAuthentication yes'
    Write-Ok 'PubkeyAuthentication enabled'
}

# Disable password auth
if ($config -match '#?\s*PasswordAuthentication\s+\w+') {
    $config = $config -replace '#?\s*PasswordAuthentication\s+\w+', 'PasswordAuthentication no'
    Write-Ok 'PasswordAuthentication disabled'
}

# Comment out the admin match block so normal authorized_keys works too
$config = $config -replace '(?m)^(Match Group administrators\s*\r?\n\s*AuthorizedKeysFile .*)$', '# $1'

Set-Content -Path $sshdConfig -Value $config -NoNewline
Write-Ok 'sshd_config updated'

# Restart sshd to apply config
Restart-Service sshd
Write-Ok 'sshd restarted with new config'

# =====================================================================
# STEP 3: Add SSH to Cloudflare Tunnel
# =====================================================================
Write-Step 'Step 3: Updating Cloudflare Tunnel config'

$cfConfig = "$env:USERPROFILE\.cloudflared\config.yml"
$cfContent = Get-Content $cfConfig -Raw

if ($cfContent -match 'ssh\.ativa-jewels\.com') {
    Write-Ok 'ssh.ativa-jewels.com already in tunnel config'
} else {
    # Read as lines, find the "- hostname: ativa-jewels.com" line, insert SSH rule before it
    $lines = Get-Content $cfConfig
    $newLines = @()
    $inserted = $false
    foreach ($line in $lines) {
        if (-not $inserted -and $line -match 'hostname:\s*ativa-jewels\.com') {
            $newLines += '  - hostname: ssh.ativa-jewels.com'
            $newLines += '    service: ssh://localhost:22'
            $inserted = $true
        }
        $newLines += $line
    }
    $newLines | Set-Content -Path $cfConfig
    Write-Ok 'Added ssh.ativa-jewels.com to tunnel config'
}

# Add DNS CNAME for the subdomain
$tunnelId = '72d55140-d7f5-40a7-bcf3-ea2770f4bd21'
Write-Host '    Adding DNS record for ssh.ativa-jewels.com ...'
cloudflared tunnel route dns $tunnelId ssh.ativa-jewels.com 2>&1 | ForEach-Object { Write-Host "    $_" }
Write-Ok 'DNS route added (or already exists)'

# Restart cloudflared service
Write-Host '    Restarting cloudflared service...'
$cfSvc = Get-Service -Name 'Cloudflared' -ErrorAction SilentlyContinue
if ($cfSvc) {
    Stop-Process -Name cloudflared -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Start-Service Cloudflared
    Write-Ok 'Cloudflared service restarted'
} else {
    Write-Warn 'Cloudflared is not running as a Windows service. Restart it manually.'
}

# =====================================================================
# DONE
# =====================================================================
Write-Step 'Setup Complete!'

$privateKey = Get-Content $keyFile -Raw
Write-Host ''
Write-Host '============================================================' -ForegroundColor Green
Write-Host '  SSH Server is ready!' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Green
Write-Host ''
Write-Host "  Your PRIVATE key is at: $keyFile" -ForegroundColor Yellow
Write-Host '  Copy this file to your dev machine at ~/.ssh/id_ed25519'
Write-Host ''
Write-Host '  Then add this to your dev machine ~/.ssh/config:' -ForegroundColor Yellow
Write-Host ''
Write-Host '    Host ssh.ativa-jewels.com'
Write-Host '        ProxyCommand cloudflared access ssh --hostname %h'
Write-Host '        User pc'
Write-Host '        IdentityFile ~/.ssh/id_ed25519'
Write-Host ''
Write-Host '  Connect with: ssh ssh.ativa-jewels.com'
Write-Host '  Or use VS Code / Cursor Remote-SSH -> ssh.ativa-jewels.com'
Write-Host ''
Write-Host '============================================================' -ForegroundColor Green

# Keep window open
Read-Host 'Press Enter to close'
