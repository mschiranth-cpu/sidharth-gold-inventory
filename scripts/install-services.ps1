# Installs Windows services for:
# - Backend (Node) using NSSM
# - Cloudflare Tunnel using cloudflared service install
#
# Must run as Administrator.

$ErrorActionPreference = 'Stop'

$backendDir = 'D:\AI websites\Sidharth Gold Inventory Site\Sidharth Gold Inventory Site\backend'
$nodeExe = 'C:\Program Files\nodejs\node.exe'
$serviceName = 'AtivaGoldInventoryBackend'

Write-Host "Installing/updating backend service: $serviceName"

if (Get-Service -Name $serviceName -ErrorAction SilentlyContinue) {
  & nssm stop $serviceName | Out-Null
} else {
  & nssm install $serviceName $nodeExe 'dist\index.js' | Out-Null
}

& nssm set $serviceName AppDirectory $backendDir | Out-Null
& nssm set $serviceName AppParameters 'dist\index.js' | Out-Null
& nssm set $serviceName AppEnvironmentExtra 'NODE_ENV=production' 'PORT=3000' | Out-Null
& nssm set $serviceName Start SERVICE_AUTO_START | Out-Null
& nssm set $serviceName AppStdout "$backendDir\logs\backend-service.log" | Out-Null
& nssm set $serviceName AppStderr "$backendDir\logs\backend-service.err.log" | Out-Null

& nssm start $serviceName | Out-Null
Start-Sleep -Seconds 2
Write-Host "Backend service status:"
& nssm status $serviceName

Write-Host "Installing Cloudflare Tunnel service"
& cloudflared service install | Out-Null
Write-Host "Done."

