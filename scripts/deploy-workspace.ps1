#Requires -Version 5.1
<#
.SYNOPSIS
    Preview, validate, deploy, or restore this workspace on the local production PC.
.EXAMPLE
    .\scripts\deploy-workspace.ps1
.EXAMPLE
    .\scripts\deploy-workspace.ps1 -Apply
.EXAMPLE
    .\scripts\deploy-workspace.ps1 -Rollback 20261022-120000-ab12cd34 -Apply
#>
[CmdletBinding()]
param(
    [string]$WorkspaceRoot,
    [string]$ProductionRoot = 'D:\AI websites\Sidharth Gold Inventory Site\Sidharth Gold Inventory Site',
    [string]$ServiceName = 'AtivaGoldInventoryBackend',
    [string]$HealthBaseUrl = 'http://localhost:3000',
    [string]$PublicBaseUrl = 'https://ativa-jewels.com',
    [switch]$Initialize,
    [switch]$Apply,
    [switch]$Validate,
    [string]$Rollback,
    [switch]$LibraryOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if (-not $WorkspaceRoot) { $WorkspaceRoot = Split-Path -Parent $PSScriptRoot }

function Get-CanonicalDirectory {
    param([string]$Path)
    if (-not [IO.Path]::IsPathRooted($Path)) { throw "An absolute directory is required: $Path" }
    $full = [IO.Path]::GetFullPath($Path).TrimEnd('\', '/')
    if ($full.Length -le [IO.Path]::GetPathRoot($full).Length) { throw 'A drive root cannot be a deployment directory.' }
    if (-not (Test-Path -LiteralPath $full -PathType Container)) { throw "Directory does not exist: $full" }
    Assert-NoReparsePoint $full
    return $full
}

function Assert-NoReparsePoint {
    param([string]$Path)
    $current = [IO.Path]::GetFullPath($Path)
    while ($current) {
        if (Test-Path -LiteralPath $current) {
            $item = Get-Item -LiteralPath $current -Force
            if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
                throw "Deployment paths cannot contain a junction or symbolic link: $current"
            }
        }
        $parent = [IO.Path]::GetDirectoryName($current)
        if ($parent -eq $current) { break }
        $current = $parent
    }
}

function Join-ContainedPath {
    param([string]$Root, [string]$RelativePath)
    if ([string]::IsNullOrWhiteSpace($RelativePath) -or [IO.Path]::IsPathRooted($RelativePath) -or
        $RelativePath -match '(^|[\\/])\.\.([\\/]|$)|:') { throw "Invalid relative path: $RelativePath" }
    $full = [IO.Path]::GetFullPath((Join-Path $Root $RelativePath))
    if (-not $full.StartsWith($Root.TrimEnd('\') + '\', [StringComparison]::OrdinalIgnoreCase)) {
        throw "Path leaves the deployment directory: $RelativePath"
    }
    Assert-NoReparsePoint $full
    return $full
}

function Get-FileDigest {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $null }
    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash
}

function Test-EquivalentSourceFile {
    param([string]$First, [string]$Second)
    $firstHash = Get-FileDigest $First
    $secondHash = Get-FileDigest $Second
    if ($firstHash -ceq $secondHash) { return $true }
    if (-not $firstHash -or -not $secondHash) { return $false }
    # LF/CRLF differences from the macOS bundle are not application changes.
    $extension = [IO.Path]::GetExtension($First).ToLowerInvariant()
    if ($extension -notin @('.ts', '.tsx', '.js', '.mjs', '.json', '.md', '.ps1', '.sh', '.css', '.html',
            '.yaml', '.yml', '.sql', '.prisma', '.svg', '.txt', '.old', '.conf') -and
        [IO.Path]::GetFileName($First) -ne 'backup-cron') {
        # Some public placeholders have a media extension but contain plain text.
        try {
            $decoder = New-Object Text.UTF8Encoding($false, $true)
            foreach ($candidate in @($First, $Second)) {
                if ($decoder.GetString([IO.File]::ReadAllBytes($candidate)) -match '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]') { return $false }
            }
        } catch { return $false }
    }
    return [IO.File]::ReadAllText($First).Replace("`r`n", "`n") -ceq [IO.File]::ReadAllText($Second).Replace("`r`n", "`n")
}

function Assert-EquivalentSourceDigests {
    param([hashtable]$Expected, [hashtable]$Actual, [string]$ExpectedRoot, [string]$ActualRoot, [string]$Message)
    $differences = @(@($Expected.Keys) + @($Actual.Keys) | Sort-Object -Unique | Where-Object {
        $Expected[$_] -cne $Actual[$_] -and -not (Test-EquivalentSourceFile (Join-ContainedPath $ExpectedRoot $_) (Join-ContainedPath $ActualRoot $_))
    })
    if ($differences.Count -gt 0) { throw "$Message`n$($differences -join "`n")" }
}

function Get-TreeDigests {
    param([string]$Root)
    $map = @{}
    if (Test-Path -LiteralPath $Root -PathType Container) {
        Assert-NoReparsePoint $Root
        $queue = New-Object 'System.Collections.Generic.Queue[string]'
        $queue.Enqueue($Root)
        while ($queue.Count -gt 0) {
            $directory = $queue.Dequeue()
            foreach ($item in Get-ChildItem -LiteralPath $directory -Force) {
                if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw "Unexpected link: $($item.FullName)" }
                if ($item.PSIsContainer) { $queue.Enqueue($item.FullName) }
                else { $map[$item.FullName.Substring($Root.Length + 1).Replace('\', '/')] = Get-FileDigest $item.FullName }
            }
        }
    }
    return $map
}

function Test-ManagedRelativePath {
    param([string]$Path)
    if ($Path -match '(^|/)(\.env[^/]*|id_ed25519[^/]*|node_modules|uploads|logs|dist|\.git)(/|$)' -or
        $Path -match '\.(pem|key|pfx|p12|db|sqlite|log)$') { return $false }
    return ($Path -match '^(backend/src|frontend/src|frontend/public|scripts|docs)/' -or $Path -in @(
        'backend/tsconfig.json', 'backend/openapi.yaml', 'frontend/index.html', 'frontend/vite.config.ts',
        'frontend/tsconfig.json', 'frontend/tsconfig.node.json', 'frontend/tailwind.config.js', 'frontend/postcss.config.js'
    ))
}

function Get-SourceDigests {
    param([string]$Root)
    $map = @{}
    foreach ($directory in @('backend/src', 'frontend/src', 'frontend/public', 'scripts', 'docs')) {
        $tree = Get-TreeDigests (Join-ContainedPath $Root $directory)
        foreach ($path in $tree.Keys) {
            $relative = "$directory/$path"
            if (Test-ManagedRelativePath $relative) { $map[$relative] = $tree[$path] }
        }
    }
    foreach ($path in @('backend/tsconfig.json', 'backend/openapi.yaml', 'frontend/index.html', 'frontend/vite.config.ts',
            'frontend/tsconfig.json', 'frontend/tsconfig.node.json', 'frontend/tailwind.config.js', 'frontend/postcss.config.js')) {
        $digest = Get-FileDigest (Join-ContainedPath $Root $path)
        if ($digest) { $map[$path] = $digest }
    }
    return $map
}

function Get-ProtectedDigests {
    param([string]$Root)
    $map = @{}
    foreach ($path in @('package.json', 'package-lock.json', 'backend/package.json', 'backend/package-lock.json',
            'frontend/package.json', 'frontend/package-lock.json')) {
        $digest = Get-FileDigest (Join-ContainedPath $Root $path)
        if ($digest) { $map[$path] = $digest }
    }
    $tree = Get-TreeDigests (Join-ContainedPath $Root 'backend/prisma')
    foreach ($path in $tree.Keys) { $map["backend/prisma/$path"] = $tree[$path] }
    return $map
}

function ConvertTo-DigestMap {
    param($Object)
    $map = @{}
    if ($null -ne $Object) {
        foreach ($property in $Object.PSObject.Properties) { $map[$property.Name] = [string]$property.Value }
    }
    return $map
}

function Assert-SameDigests {
    param([hashtable]$Expected, [hashtable]$Actual, [string]$Message)
    $changed = @(@($Expected.Keys) + @($Actual.Keys) | Sort-Object -Unique | Where-Object { $Expected[$_] -cne $Actual[$_] })
    if ($changed.Count -gt 0) { throw "$Message`n$($changed -join "`n")" }
}

function Write-DeploymentJson {
    param([string]$Path, $Value)
    Assert-NoReparsePoint $Path
    $directory = Split-Path -Parent $Path
    [IO.Directory]::CreateDirectory($directory) | Out-Null
    $temporary = Join-Path $directory ('.json-' + [Guid]::NewGuid().ToString('N').Substring(0, 16) + '.tmp')
    [IO.File]::WriteAllText($temporary, ($Value | ConvertTo-Json -Depth 14), (New-Object Text.UTF8Encoding($false)))
    $previous = Join-Path $directory ('.json-' + [Guid]::NewGuid().ToString('N').Substring(0, 16) + '.previous')
    try {
        if (Test-Path -LiteralPath $Path) { [IO.File]::Replace($temporary, $Path, $previous) }
        else { [IO.File]::Move($temporary, $Path) }
    } finally {
        if (Test-Path -LiteralPath $previous) { [IO.File]::Delete($previous) }
        if (Test-Path -LiteralPath $temporary) { [IO.File]::Delete($temporary) }
    }
}

function Copy-DeploymentFile {
    param([string]$Source, [string]$Destination)
    Assert-NoReparsePoint $Source
    Assert-NoReparsePoint $Destination
    [IO.Directory]::CreateDirectory((Split-Path -Parent $Destination)) | Out-Null
    # Write in the destination directory, then replace the file atomically.
    $directory = Split-Path -Parent $Destination
    $temporary = Join-Path $directory ('.ativa-' + [Guid]::NewGuid().ToString('N').Substring(0, 16) + '.tmp')
    $previous = Join-Path $directory ('.ativa-' + [Guid]::NewGuid().ToString('N').Substring(0, 16) + '.previous')
    try {
        [IO.File]::Copy($Source, $temporary, $false)
        if (Test-Path -LiteralPath $Destination) { [IO.File]::Replace($temporary, $Destination, $previous) }
        else { [IO.File]::Move($temporary, $Destination) }
    } finally {
        if (Test-Path -LiteralPath $temporary) { [IO.File]::Delete($temporary) }
        if (Test-Path -LiteralPath $previous) { [IO.File]::Delete($previous) }
    }
}

function Assert-DeploymentService {
    param($Context)
    $service = Get-Service -Name $Context.ServiceName -ErrorAction Stop
    if ($service.Status -ne 'Running') { throw "Backend service $($Context.ServiceName) must already be running." }
    $settings = Get-ItemProperty -LiteralPath "HKLM:\SYSTEM\CurrentControlSet\Services\$($Context.ServiceName)\Parameters"
    if (-not [string]::Equals([IO.Path]::GetFullPath($settings.AppDirectory).TrimEnd('\'),
            (Join-Path $Context.ProductionRoot 'backend'), [StringComparison]::OrdinalIgnoreCase) -or
        $settings.AppParameters -notmatch '^dist[\\/]index\.js$') {
        throw 'The backend service is not bound to the selected production backend/dist/index.js.'
    }
}

function Restart-DeploymentService {
    param($Context)
    Restart-Service -Name $Context.ServiceName -ErrorAction Stop
    (Get-Service -Name $Context.ServiceName).WaitForStatus('Running', [TimeSpan]::FromSeconds(30))
}

function Stop-DeploymentService {
    param($Context)
    Stop-Service -Name $Context.ServiceName -ErrorAction Stop
    (Get-Service -Name $Context.ServiceName).WaitForStatus('Stopped', [TimeSpan]::FromSeconds(30))
}

function Assert-DeploymentHealth {
    param($Context, [bool]$CheckFrontend = $true)
    foreach ($base in @($Context.HealthBaseUrl, $Context.PublicBaseUrl) | Where-Object { $_ } | Select-Object -Unique) {
        $healthy = $false
        $lastError = ''
        for ($attempt = 0; $attempt -lt 12; $attempt++) {
            try {
                foreach ($probe in @(@('/health', 'healthy'), @('/health/ready', 'ready'))) {
                    $response = Invoke-WebRequest -Uri ($base.TrimEnd('/') + $probe[0]) -UseBasicParsing -TimeoutSec 5
                    if ($response.StatusCode -ne 200 -or ($response.Content | ConvertFrom-Json).status -ne $probe[1]) {
                        throw "Readiness probe failed at $base$($probe[0])"
                    }
                }
                $healthy = $true
                break
            } catch { $lastError = $_.Exception.Message; Start-Sleep -Seconds 1 }
        }
        if (-not $healthy) { throw "Production health check failed: $lastError" }
        if ($CheckFrontend) {
            $response = Invoke-WebRequest -Uri ($base.TrimEnd('/') + '/') -UseBasicParsing -TimeoutSec 10 -Headers @{ 'Cache-Control' = 'no-cache' }
            $expected = [IO.File]::ReadAllText((Join-Path $Context.ProductionRoot 'frontend\dist\index.html'))
            $assets = [regex]::Matches($expected, '(?:src|href)=["''](/[^"''?]+\.(?:js|css))["'']')
            if ($assets.Count -eq 0) { throw 'The deployed homepage has no JavaScript or CSS entry points.' }
            # Cloudflare can inject analytics into HTML; compare our compiled entry points.
            $expectedAssets = @($assets | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
            $servedAssets = @([regex]::Matches($response.Content, '(?:src|href)=["''](/assets/[^"''?]+\.(?:js|css))["'']') |
                ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
            if ($response.StatusCode -ne 200 -or $response.Content -notmatch '<div\s+id=["'']root["'']' -or
                ($expectedAssets -join "`n") -cne ($servedAssets -join "`n")) {
                throw "The homepage at $base does not reference the deployed build."
            }
            foreach ($asset in $assets) {
                $assetPath = $asset.Groups[1].Value
                $assetResponse = Invoke-WebRequest -Uri ($base.TrimEnd('/') + $assetPath) -UseBasicParsing -TimeoutSec 15
                if ($assetResponse.StatusCode -ne 200 -or $assetResponse.Headers['Content-Type'] -match 'text/html') {
                    throw "Build asset could not be loaded: $assetPath"
                }
            }
        }
    }
}

function Invoke-StageBuild {
    param($Context, [string]$StageRoot, [bool]$BuildBackend, [bool]$BuildFrontend)
    $node = (Get-Command node.exe -ErrorAction Stop).Source
    foreach ($side in @('backend', 'frontend')) {
        if (($side -eq 'backend' -and -not $BuildBackend) -or ($side -eq 'frontend' -and -not $BuildFrontend)) { continue }
        $dependencies = Join-Path $Context.ProductionRoot "$side\node_modules"
        if (-not (Test-Path -LiteralPath $dependencies -PathType Container)) { throw "Production $side dependencies are missing." }
        $link = Join-Path $StageRoot "$side\node_modules"
        New-Item -ItemType Junction -Path $link -Target $dependencies | Out-Null
        try {
            Push-Location (Join-Path $StageRoot $side)
            try {
                $priorErrorPreference = $ErrorActionPreference
                $ErrorActionPreference = 'Continue'
                try {
                    if ($side -eq 'backend') {
                        & $node (Join-Path $dependencies 'typescript\bin\tsc') '--project' 'tsconfig.json' '--incremental' 'false' '--noEmitOnError' 2>&1 | ForEach-Object { Write-Host "$_" }
                    } else {
                        & $node (Join-Path $Context.WorkspaceRoot 'scripts\deploy-frontend-build.mjs') (Join-Path $StageRoot 'frontend') (Join-Path $Context.ProductionRoot 'frontend') 2>&1 | ForEach-Object { Write-Host "$_" }
                    }
                    $buildExit = $LASTEXITCODE
                } finally { $ErrorActionPreference = $priorErrorPreference }
                if ($buildExit -ne 0) { throw "$side build failed (exit $buildExit). Production has not been changed." }
            } finally { Pop-Location }
        } finally {
            # Directory.Delete removes the junction itself without traversing its target.
            if (Test-Path -LiteralPath $link) { [IO.Directory]::Delete($link) }
        }
    }
    if ($BuildBackend -and -not (Test-Path -LiteralPath (Join-Path $StageRoot 'backend\dist\index.js'))) { throw 'Backend build did not produce dist/index.js.' }
    if ($BuildFrontend -and -not (Test-Path -LiteralPath (Join-Path $StageRoot 'frontend\dist\index.html'))) { throw 'Frontend build did not produce dist/index.html.' }
}

function Save-DeploymentState {
    param($Context, [string]$DeploymentId, [string[]]$WorkspacePaths)
    $state = [ordered]@{
        Version = 1; ProductionRoot = $Context.ProductionRoot; DeploymentId = $DeploymentId
        UpdatedAt = [DateTime]::UtcNow.ToString('o'); WorkspacePaths = @($WorkspacePaths)
        ProductionFiles = Get-SourceDigests $Context.ProductionRoot
        ProtectedFiles = Get-ProtectedDigests $Context.ProductionRoot
        BackendOutput = Get-TreeDigests (Join-Path $Context.ProductionRoot 'backend\dist')
        FrontendOutput = Get-TreeDigests (Join-Path $Context.ProductionRoot 'frontend\dist')
    }
    Write-DeploymentJson $Context.StatePath $state
}

function Assert-ProductionBaseline {
    param($Context, $State)
    if (-not [string]::Equals($State.ProductionRoot, $Context.ProductionRoot, [StringComparison]::OrdinalIgnoreCase)) { throw 'The saved baseline belongs to another production directory.' }
    Assert-SameDigests (ConvertTo-DigestMap $State.ProductionFiles) (Get-SourceDigests $Context.ProductionRoot) 'Production source changed outside this helper. Reconcile those edits before deploying.'
    Assert-SameDigests (ConvertTo-DigestMap $State.ProtectedFiles) (Get-ProtectedDigests $Context.ProductionRoot) 'Production dependencies or database schema changed outside this helper.'
    Assert-SameDigests (ConvertTo-DigestMap $State.BackendOutput) (Get-TreeDigests (Join-Path $Context.ProductionRoot 'backend\dist')) 'Production backend output changed outside this helper.'
    Assert-SameDigests (ConvertTo-DigestMap $State.FrontendOutput) (Get-TreeDigests (Join-Path $Context.ProductionRoot 'frontend\dist')) 'Production frontend output changed outside this helper.'
}

function Assert-DeploymentSnapshot {
    param($Context, $Manifest, [string]$RunRoot, [string]$SnapshotName = 'before')
    $snapshotRoot = Join-ContainedPath $RunRoot $SnapshotName
    foreach ($entry in $Manifest.Operations) {
        if ($null -ne $entry.BeforeHash -and $entry.BeforeHash -ne '') {
            $backup = Join-ContainedPath $snapshotRoot $entry.Path
            if ((Get-FileDigest $backup) -cne $entry.BeforeHash) { throw "Backup verification failed: $($entry.Path)" }
        }
    }
}

function Restore-DeploymentSnapshot {
    param($Context, $Manifest, [string]$RunRoot, [string]$SnapshotName = 'before')
    Assert-DeploymentSnapshot $Context $Manifest $RunRoot $SnapshotName
    $snapshotRoot = Join-ContainedPath $RunRoot $SnapshotName
    if ($Manifest.BuildBackend) { Stop-DeploymentService $Context }
    foreach ($entry in @($Manifest.Operations | Sort-Object @{Expression={ $_.Path -eq 'frontend/dist/index.html' }}, Path)) {
        $target = Join-ContainedPath $Context.ProductionRoot $entry.Path
        if ($null -eq $entry.BeforeHash -or $entry.BeforeHash -eq '') {
            if (Test-Path -LiteralPath $target -PathType Leaf) { [IO.File]::Delete($target) }
        } else { Copy-DeploymentFile (Join-ContainedPath $snapshotRoot $entry.Path) $target }
    }
    if ($Manifest.BuildBackend) { Restart-DeploymentService $Context }
    Assert-DeploymentHealth $Context $true
    foreach ($entry in $Manifest.Operations) {
        if ((Get-FileDigest (Join-ContainedPath $Context.ProductionRoot $entry.Path)) -cne $entry.BeforeHash) { throw "Restored file verification failed: $($entry.Path)" }
    }
}

function Invoke-WorkspaceDeployment {
    [CmdletBinding()]
    param(
        [string]$WorkspaceRoot, [string]$ProductionRoot, [string]$ServiceName = 'AtivaGoldInventoryBackend',
        [string]$HealthBaseUrl = 'http://localhost:3000', [string]$PublicBaseUrl = 'https://ativa-jewels.com',
        [switch]$Initialize, [switch]$Apply, [switch]$Validate, [string]$Rollback
    )
    if (@(@($Initialize, $Validate) | Where-Object { $_ }).Count -gt 1 -or ($Initialize -and ($Apply -or $Rollback)) -or ($Validate -and ($Apply -or $Rollback))) {
        throw 'Choose initialization, validation, deployment, or rollback as separate operations.'
    }
    $workspace = Get-CanonicalDirectory $WorkspaceRoot
    $production = Get-CanonicalDirectory $ProductionRoot
    if ($workspace -eq $production -or $workspace.StartsWith($production + '\', [StringComparison]::OrdinalIgnoreCase) -or
        $production.StartsWith($workspace + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Workspace and production must be separate, non-overlapping directories.' }
    foreach ($root in @($workspace, $production)) {
        foreach ($required in @('backend/src/index.ts', 'frontend/index.html', 'backend/package.json', 'frontend/package.json', 'backend/prisma/schema.prisma')) {
            if (-not (Test-Path -LiteralPath (Join-ContainedPath $root $required) -PathType Leaf)) { throw "Not an Ativa application directory: $root (missing $required)" }
        }
    }
    $dataRoot = Join-ContainedPath $workspace '.deployments'
    $context = [PSCustomObject]@{ WorkspaceRoot=$workspace; ProductionRoot=$production; ServiceName=$ServiceName
        HealthBaseUrl=$HealthBaseUrl; PublicBaseUrl=$PublicBaseUrl; DataRoot=$dataRoot; StatePath=(Join-Path $dataRoot 'state.json') }
    Write-Host "Workspace: $workspace"
    Write-Host "Production: $production"
    $lock = $null
    $machineLock = $null
    $machineLockOwned = $false
    try {
        if ($Initialize -or $Apply -or $Validate) {
            $sha = [Security.Cryptography.SHA256]::Create()
            try { $targetKey = [BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($production.ToLowerInvariant()))).Replace('-', '') }
            finally { $sha.Dispose() }
            $machineLock = New-Object Threading.Mutex($false, "Global\AtivaWorkspaceDeploy-$targetKey")
            try { $machineLockOwned = $machineLock.WaitOne(0) }
            catch [Threading.AbandonedMutexException] { $machineLockOwned = $true }
            if (-not $machineLockOwned) { throw 'Another deployment is operating on this production directory.' }
            [IO.Directory]::CreateDirectory($dataRoot) | Out-Null
            try { $lock = [IO.File]::Open((Join-Path $dataRoot 'deployment.lock'), 'OpenOrCreate', 'ReadWrite', 'None') }
            catch { throw 'Another workspace deployment, validation, or rollback is running.' }
        }
        $workspaceFiles = Get-SourceDigests $workspace
        $productionFiles = Get-SourceDigests $production
        $protected = Get-ProtectedDigests $workspace
        if (-not $Rollback) {
            Assert-EquivalentSourceDigests $protected (Get-ProtectedDigests $production) $workspace $production 'Dependencies or Prisma files differ. Handle installation/schema patches separately before using this helper.'
        }
        if ($Initialize) {
            if (Test-Path -LiteralPath $context.StatePath) { throw 'A baseline already exists. It will not be overwritten; reconcile production drift explicitly.' }
            $localApp = @{}; $prodApp = @{}
            foreach ($path in $workspaceFiles.Keys) { if ($path -notmatch '^(scripts|docs)/') { $localApp[$path] = $workspaceFiles[$path] } }
            foreach ($path in $productionFiles.Keys) { if ($path -notmatch '^(scripts|docs)/') { $prodApp[$path] = $productionFiles[$path] } }
            Assert-EquivalentSourceDigests $localApp $prodApp $workspace $production 'Initial application sources must match production before establishing a baseline.'
            Assert-DeploymentService $context
            Assert-DeploymentHealth $context $true
            Save-DeploymentState $context 'baseline' @($workspaceFiles.Keys)
            return [PSCustomObject]@{ Status='Initialized'; Changes=@(); StatePath=$context.StatePath }
        }
        if (-not (Test-Path -LiteralPath $context.StatePath)) { throw 'Initialize the verified production baseline first: .\scripts\deploy-workspace.ps1 -Initialize' }
        $state = Get-Content -LiteralPath $context.StatePath -Raw | ConvertFrom-Json
        Assert-ProductionBaseline $context $state
        if ($Rollback) {
            if ($Rollback -notmatch '^\d{8}-\d{6}-[a-f0-9]{8}$') { throw 'Invalid deployment ID.' }
            $runRoot = Join-ContainedPath $dataRoot $Rollback
            $manifestPath = Join-ContainedPath $runRoot 'manifest.json'
            $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
            if ($manifest.DeploymentId -ne $Rollback -or $manifest.ProductionRoot -ne $production -or
                $manifest.Status -ne 'Deployed' -or $state.DeploymentId -ne $Rollback) { throw 'Only the latest successful deployment for this production directory can be rolled back.' }
            foreach ($entry in $manifest.Operations) {
                if (-not ((Test-ManagedRelativePath $entry.Path) -or $entry.Path -match '^(backend|frontend)/dist/')) { throw 'The rollback manifest contains an unmanaged path.' }
                if ((Get-FileDigest (Join-ContainedPath $production $entry.Path)) -cne $entry.AfterHash) { throw "Production rollback conflict: $($entry.Path)" }
            }
            if (-not $Apply) { return [PSCustomObject]@{ Status='Preview'; DeploymentId=$Rollback; Changes=@($manifest.Operations) } }
            Assert-DeploymentService $context
            Assert-DeploymentSnapshot $context $manifest $runRoot
            $expectedRestore = @{
                Source = (ConvertTo-DigestMap $state.ProductionFiles)
                Protected = (ConvertTo-DigestMap $state.ProtectedFiles)
                Backend = (ConvertTo-DigestMap $state.BackendOutput)
                Frontend = (ConvertTo-DigestMap $state.FrontendOutput)
            }
            $recoveryOperations = @()
            foreach ($entry in $manifest.Operations) {
                $expectedMap = $expectedRestore.Source
                $expectedKey = $entry.Path
                if ($entry.Path.StartsWith('backend/dist/')) { $expectedMap = $expectedRestore.Backend; $expectedKey = $entry.Path.Substring(13) }
                elseif ($entry.Path.StartsWith('frontend/dist/')) { $expectedMap = $expectedRestore.Frontend; $expectedKey = $entry.Path.Substring(14) }
                if ($entry.BeforeHash) { $expectedMap[$expectedKey] = $entry.BeforeHash }
                else { $expectedMap.Remove($expectedKey) }
                $recoveryOperations += [PSCustomObject]@{ Path=$entry.Path; BeforeHash=$entry.AfterHash; AfterHash=$entry.BeforeHash }
                if ($entry.AfterHash) {
                    $backup = Join-ContainedPath $runRoot ("rollback-before/" + $entry.Path)
                    Copy-DeploymentFile (Join-ContainedPath $production $entry.Path) $backup
                    if ((Get-FileDigest $backup) -cne $entry.AfterHash) { throw "Rollback recovery backup mismatch: $($entry.Path)" }
                }
            }
            $recoveryManifest = [PSCustomObject]@{ Operations=$recoveryOperations; BuildBackend=$manifest.BuildBackend }
            Assert-ProductionBaseline $context $state
            try {
                $manifest.Status = 'RollingBack'; Write-DeploymentJson $manifestPath $manifest
                Restore-DeploymentSnapshot $context $manifest $runRoot
                Assert-SameDigests $expectedRestore.Source (Get-SourceDigests $production) 'Production source changed during rollback.'
                Assert-SameDigests $expectedRestore.Protected (Get-ProtectedDigests $production) 'Production dependencies/schema changed during rollback.'
                Assert-SameDigests $expectedRestore.Backend (Get-TreeDigests (Join-Path $production 'backend\dist')) 'Production backend output changed during rollback.'
                Assert-SameDigests $expectedRestore.Frontend (Get-TreeDigests (Join-Path $production 'frontend\dist')) 'Production frontend output changed during rollback.'
                $trackedPaths = @(@($manifest.PreviousWorkspacePaths) + @($workspaceFiles.Keys) | Sort-Object -Unique)
                Save-DeploymentState $context "rollback-$Rollback" $trackedPaths
                $manifest.Status = 'RolledBack'; Write-DeploymentJson $manifestPath $manifest
            } catch {
                $rollbackError = $_.Exception.Message
                try {
                    Restore-DeploymentSnapshot $context $recoveryManifest $runRoot 'rollback-before'
                    Write-DeploymentJson $context.StatePath $state
                    $manifest.Status = 'Deployed'; Write-DeploymentJson $manifestPath $manifest
                } catch {
                    $manifest.Status = 'RecoveryRequired'; Write-DeploymentJson $manifestPath $manifest
                    throw "Rollback $Rollback failed: $rollbackError. Recovery also failed: $($_.Exception.Message). Backups: $runRoot"
                }
                throw "Rollback $Rollback failed; the deployed version was restored: $rollbackError"
            }
            return [PSCustomObject]@{ Status='RolledBack'; DeploymentId=$Rollback; Changes=@($manifest.Operations) }
        }
        $changes = @()
        foreach ($path in @(@($workspaceFiles.Keys) + @($state.WorkspacePaths) | Sort-Object -Unique)) {
            if ($workspaceFiles[$path] -cne $productionFiles[$path] -and
                -not (Test-EquivalentSourceFile (Join-ContainedPath $workspace $path) (Join-ContainedPath $production $path))) {
                $action = 'Update'
                if (-not $productionFiles.ContainsKey($path)) { $action = 'Add' }
                elseif (-not $workspaceFiles.ContainsKey($path)) { $action = 'Delete' }
                $changes += [PSCustomObject]@{ Path=$path; Action=$action; BeforeHash=$productionFiles[$path]; AfterHash=$workspaceFiles[$path] }
            }
        }
        $buildBackend = $Validate -or @($changes | Where-Object { $_.Path -match '^backend/(src/|tsconfig\.json$|openapi\.yaml$)' }).Count -gt 0
        $buildFrontend = $Validate -or @($changes | Where-Object { $_.Path -match '^frontend/' }).Count -gt 0
        Write-Host ("{0} source changes; backend build: {1}; frontend build: {2}" -f $changes.Count, $buildBackend, $buildFrontend)
        foreach ($change in $changes) { Write-Host ("  {0}: {1}" -f $change.Action, $change.Path) }
        if ($changes.Count -eq 0 -and -not $Validate) { return [PSCustomObject]@{ Status='NoChanges'; Changes=@() } }
        if (-not $Apply -and -not $Validate) { return [PSCustomObject]@{ Status='Preview'; Changes=$changes; BuildBackend=$buildBackend; BuildFrontend=$buildFrontend } }
        Assert-DeploymentService $context
        Assert-DeploymentHealth $context $true
        $id = [DateTime]::Now.ToString('yyyyMMdd-HHmmss') + '-' + [Guid]::NewGuid().ToString('N').Substring(0, 8)
        $runRoot = Join-ContainedPath $dataRoot $id
        $stageRoot = Join-ContainedPath $runRoot 'stage'
        [IO.Directory]::CreateDirectory($stageRoot) | Out-Null
        foreach ($path in $workspaceFiles.Keys) { Copy-DeploymentFile (Join-ContainedPath $workspace $path) (Join-ContainedPath $stageRoot $path) }
        foreach ($path in $protected.Keys) { Copy-DeploymentFile (Join-ContainedPath $workspace $path) (Join-ContainedPath $stageRoot $path) }
        Assert-SameDigests $workspaceFiles (Get-SourceDigests $stageRoot) 'Staged source did not match the captured workspace.'
        Assert-SameDigests $protected (Get-ProtectedDigests $stageRoot) 'Staged dependencies/schema did not match the captured workspace.'
        Invoke-StageBuild $context $stageRoot $buildBackend $buildFrontend
        Assert-SameDigests $workspaceFiles (Get-SourceDigests $workspace) 'Workspace source changed while staging. Run the deployment again.'
        Assert-SameDigests $protected (Get-ProtectedDigests $workspace) 'Dependencies or schema changed while staging.'
        Assert-ProductionBaseline $context $state
        if ($Validate) { return [PSCustomObject]@{ Status='Validated'; DeploymentId=$id; Changes=$changes } }
        $operations = @($changes | ForEach-Object { [PSCustomObject]@{ Path=$_.Path; BeforeHash=$_.BeforeHash; AfterHash=$_.AfterHash } })
        $expectedSource = @{}
        foreach ($path in $productionFiles.Keys) { $expectedSource[$path] = $productionFiles[$path] }
        foreach ($change in $changes) {
            if ($change.AfterHash) { $expectedSource[$change.Path] = $change.AfterHash }
            else { $expectedSource.Remove($change.Path) }
        }
        $expectedOutputs = @{}
        foreach ($side in @('backend', 'frontend')) {
            if (($side -eq 'backend' -and -not $buildBackend) -or ($side -eq 'frontend' -and -not $buildFrontend)) { continue }
            $next = Get-TreeDigests (Join-Path $stageRoot "$side\dist")
            $previous = Get-TreeDigests (Join-Path $production "$side\dist")
            $expectedOutput = @{}
            if ($side -eq 'frontend') {
                foreach ($path in $previous.Keys) {
                    if ($path -match '^assets/.+-[A-Za-z0-9_-]{8,}\.[^/]+$') { $expectedOutput[$path] = $previous[$path] }
                }
            }
            foreach ($path in $next.Keys) { $expectedOutput[$path] = $next[$path] }
            $expectedOutputs[$side] = $expectedOutput
            # Keep fingerprinted frontend assets for already-open browser tabs. index.html is replaced last.
            $paths = @(@($expectedOutput.Keys) + @($previous.Keys) | Sort-Object -Unique)
            foreach ($path in $paths) {
                if ($previous[$path] -cne $expectedOutput[$path]) { $operations += [PSCustomObject]@{ Path="$side/dist/$path"; BeforeHash=$previous[$path]; AfterHash=$expectedOutput[$path] } }
            }
        }
        $beforeRoot = Join-ContainedPath $runRoot 'before'
        foreach ($entry in $operations) {
            if ($entry.BeforeHash) {
                $backup = Join-ContainedPath $beforeRoot $entry.Path
                Copy-DeploymentFile (Join-ContainedPath $production $entry.Path) $backup
                if ((Get-FileDigest $backup) -cne $entry.BeforeHash) { throw "Backup did not match production: $($entry.Path)" }
            }
        }
        # Complete compiled-output snapshots are retained even when most files are identical.
        foreach ($side in @('backend', 'frontend')) {
            if (($side -eq 'backend' -and -not $buildBackend) -or ($side -eq 'frontend' -and -not $buildFrontend)) { continue }
            foreach ($path in (Get-TreeDigests (Join-Path $production "$side\dist")).Keys) {
                $relative = "$side/dist/$path"
                Copy-DeploymentFile (Join-ContainedPath $production $relative) (Join-ContainedPath $beforeRoot $relative)
            }
        }
        $manifest = [PSCustomObject]@{ Version=1; DeploymentId=$id; ProductionRoot=$production; WorkspaceRoot=$workspace
            CreatedAt=[DateTime]::UtcNow.ToString('o'); Status='Prepared'; BuildBackend=$buildBackend; BuildFrontend=$buildFrontend
            PreviousWorkspacePaths=@($state.WorkspacePaths); Operations=$operations }
        $manifestPath = Join-ContainedPath $runRoot 'manifest.json'
        Write-DeploymentJson $manifestPath $manifest
        Assert-SameDigests $workspaceFiles (Get-SourceDigests $workspace) 'Workspace changed before deployment.'
        Assert-ProductionBaseline $context $state
        $mutationStarted = $false
        try {
            $manifest.Status = 'Applying'; Write-DeploymentJson $manifestPath $manifest
            $mutationStarted = $true
            if ($buildBackend) { Stop-DeploymentService $context }
            foreach ($entry in @($operations | Sort-Object @{Expression={ $_.Path -eq 'frontend/dist/index.html' }}, Path)) {
                $target = Join-ContainedPath $production $entry.Path
                if ($entry.AfterHash) { Copy-DeploymentFile (Join-ContainedPath $stageRoot $entry.Path) $target }
                elseif (Test-Path -LiteralPath $target -PathType Leaf) { [IO.File]::Delete($target) }
            }
            if ($buildBackend) { Restart-DeploymentService $context }
            Assert-DeploymentHealth $context $true
            foreach ($entry in $operations) {
                if ((Get-FileDigest (Join-ContainedPath $production $entry.Path)) -cne $entry.AfterHash) { throw "Post-deployment file mismatch: $($entry.Path)" }
            }
            Assert-SameDigests $workspaceFiles (Get-SourceDigests $workspace) 'Workspace changed during deployment.'
            foreach ($path in $workspaceFiles.Keys) {
                if (-not (Test-EquivalentSourceFile (Join-ContainedPath $workspace $path) (Join-ContainedPath $production $path))) { throw "Workspace and production do not match: $path" }
            }
            Assert-SameDigests $expectedSource (Get-SourceDigests $production) 'Production source changed during deployment.'
            Assert-SameDigests (ConvertTo-DigestMap $state.ProtectedFiles) (Get-ProtectedDigests $production) 'Production dependencies/schema changed during deployment.'
            foreach ($side in @('backend', 'frontend')) {
                $expectedOutput = ConvertTo-DigestMap $state.BackendOutput
                if ($side -eq 'frontend') { $expectedOutput = ConvertTo-DigestMap $state.FrontendOutput }
                if ($expectedOutputs.ContainsKey($side)) { $expectedOutput = $expectedOutputs[$side] }
                Assert-SameDigests $expectedOutput (Get-TreeDigests (Join-Path $production "$side\dist")) "Production $side build changed during deployment."
            }
            $manifest.Status = 'Deployed'; Write-DeploymentJson $manifestPath $manifest
            Save-DeploymentState $context $id @($workspaceFiles.Keys)
            return [PSCustomObject]@{ Status='Deployed'; DeploymentId=$id; Changes=$changes; ManifestPath=$manifestPath }
        } catch {
            $originalError = $_.Exception.Message
            if ($mutationStarted) {
                try {
                    Restore-DeploymentSnapshot $context $manifest $runRoot
                    # Preserve the previously verified baseline, including its deployment ID.
                    Write-DeploymentJson $context.StatePath $state
                    $manifest.Status = 'RestoredAfterFailure'; Write-DeploymentJson $manifestPath $manifest
                } catch {
                    $manifest.Status = 'RecoveryRequired'; Write-DeploymentJson $manifestPath $manifest
                    throw "Deployment $id failed: $originalError. Automatic restore also failed: $($_.Exception.Message). Backups: $beforeRoot"
                }
            }
            throw "Deployment $id failed and the previous files were restored: $originalError"
        }
    } finally {
        if ($null -ne $lock) { $lock.Dispose() }
        if ($null -ne $machineLock) {
            if ($machineLockOwned) { $machineLock.ReleaseMutex() }
            $machineLock.Dispose()
        }
    }
}

if (-not $LibraryOnly) {
    try {
        Invoke-WorkspaceDeployment -WorkspaceRoot $WorkspaceRoot -ProductionRoot $ProductionRoot -ServiceName $ServiceName `
            -HealthBaseUrl $HealthBaseUrl -PublicBaseUrl $PublicBaseUrl -Initialize:$Initialize -Apply:$Apply -Validate:$Validate -Rollback $Rollback
    } catch { Write-Error $_; exit 1 }
}
