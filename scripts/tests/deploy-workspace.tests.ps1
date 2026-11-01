#requires -Version 5.1
<#
Fixture-only regression checks for deploy-workspace.ps1. No application tests,
database connections, network requests, package installs, or services run here.
Each run keeps its fixtures in .deployments/tests for failure diagnostics.
#>
[CmdletBinding()]
param(
    [string]$HelperPath
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
if (-not $HelperPath) { $HelperPath = Join-Path (Split-Path $PSScriptRoot -Parent) 'deploy-workspace.ps1' }

if (-not (Test-Path -LiteralPath $HelperPath -PathType Leaf)) {
    throw "Deployment helper not found: $HelperPath"
}

$script:TestRepositoryRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$script:TestRunRoot = Join-Path $script:TestRepositoryRoot ('.deployments/tests/t-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
New-Item -ItemType Directory -Path $script:TestRunRoot -Force | Out-Null
$script:TestResults = @()
$script:FixtureCount = 0

. $HelperPath -LibraryOnly

function Write-FixtureFile {
    param([string]$Root, [string]$RelativePath, [string]$Content)
    $path = Join-Path $Root $RelativePath
    $parent = Split-Path $path -Parent
    New-Item -ItemType Directory -Path $parent -Force | Out-Null
    [System.IO.File]::WriteAllText($path, $Content, (New-Object System.Text.UTF8Encoding($false)))
}

function Read-FixtureFile {
    param([string]$Root, [string]$RelativePath)
    return [System.IO.File]::ReadAllText((Join-Path $Root $RelativePath))
}

function Get-FixtureSnapshot {
    param([string]$Root)
    $prefix = $Root.TrimEnd([char[]]'\/') + [System.IO.Path]::DirectorySeparatorChar
    $rows = @(Get-ChildItem -LiteralPath $Root -Recurse -File -Force | ForEach-Object {
        $relative = $_.FullName.Substring($prefix.Length).Replace('\', '/')
        '{0} {1}' -f $relative, (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash
    } | Sort-Object)
    return $rows -join "`n"
}

function Reset-FixtureMocks {
    $script:FixtureMocks = [pscustomobject]@{
        BuildCalls = 0
        BackendBuilds = 0
        FrontendBuilds = 0
        ServiceChecks = 0
        Stops = 0
        Restarts = 0
        HealthChecks = 0
        FailBuild = $false
        FailHealthAt = 0
        EditWorkspaceDuringBuild = $false
    }
}

# These are the helper's injectable side-effect boundaries. All operations below
# stay in the temporary fixture roots; calling the actual build or service code
# would be a test failure.
function Invoke-StageBuild {
    param($Context, [string]$StageRoot, [bool]$BuildBackend, [bool]$BuildFrontend)
    $script:FixtureMocks.BuildCalls++
    if ($script:FixtureMocks.FailBuild) { throw 'Fixture build failure' }
    if ($BuildBackend) {
        $script:FixtureMocks.BackendBuilds++
        Write-FixtureFile $StageRoot 'backend/dist/index.js' ('fixture-backend-build-{0}' -f $script:FixtureMocks.BackendBuilds)
    }
    if ($BuildFrontend) {
        $script:FixtureMocks.FrontendBuilds++
        Write-FixtureFile $StageRoot 'frontend/dist/index.html' ('fixture-frontend-build-{0}' -f $script:FixtureMocks.FrontendBuilds)
        Write-FixtureFile $StageRoot 'frontend/dist/assets/app.js' ('fixture-frontend-asset-{0}' -f $script:FixtureMocks.FrontendBuilds)
    }
    if ($script:FixtureMocks.EditWorkspaceDuringBuild) {
        Write-FixtureFile $Context.WorkspaceRoot 'backend/src/index.ts' 'fixture source edited while building'
    }
}

function Assert-DeploymentService {
    param($Context)
    $script:FixtureMocks.ServiceChecks++
}

function Restart-DeploymentService {
    param($Context)
    $script:FixtureMocks.Restarts++
}

function Stop-DeploymentService {
    param($Context)
    $script:FixtureMocks.Stops++
}

function Assert-DeploymentHealth {
    param($Context, [bool]$CheckFrontend)
    $script:FixtureMocks.HealthChecks++
    if ($script:FixtureMocks.FailHealthAt -eq $script:FixtureMocks.HealthChecks) {
        throw 'Fixture health failure'
    }
}

function Assert-Fixture {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) { throw "Assertion failed: $Message" }
}

function Assert-FixtureEqual {
    param($Actual, $Expected, [string]$Message)
    if ($Actual -cne $Expected) {
        throw "Assertion failed: $Message`nExpected: $Expected`nActual: $Actual"
    }
}

function Assert-FixtureThrows {
    param([scriptblock]$Action, [string]$Message, [string]$Pattern)
    $caught = $null
    try { & $Action | Out-Null } catch { $caught = $_ }
    if ($null -eq $caught) { throw "Assertion failed: expected rejection: $Message" }
    if ($Pattern -and $caught.Exception.Message -notmatch $Pattern) {
        throw "Assertion failed: wrong rejection for $Message : $($caught.Exception.Message)"
    }
    return $caught
}

function New-DeploymentFixture {
    param([string]$Name)
    Reset-FixtureMocks
    # Keep paths short enough for Windows PowerShell 5.1 and retain the readable
    # case name in a separate file for diagnostics.
    $script:FixtureCount++
    $root = Join-Path $script:TestRunRoot ('{0:d2}' -f $script:FixtureCount)
    $workspace = Join-Path $root 'w'
    $production = Join-Path $root 'p'
    Write-FixtureFile $root 'test-case.txt' $Name
    $files = [ordered]@{
        'package.json' = '{"name":"fixture-root","private":true,"version":"1.0.0"}'
        'docs/test-note.md' = 'Fixture deployment documentation v1'
        'backend/package.json' = '{"name":"fixture-backend","version":"1.0.0","scripts":{"build":"tsc"}}'
        'backend/package-lock.json' = '{"name":"fixture-backend","lockfileVersion":3,"packages":{}}'
        'backend/tsconfig.json' = '{"compilerOptions":{"outDir":"dist"},"include":["src"]}'
        'backend/src/index.ts' = 'export const fixture = "backend-v1";'
        'backend/src/obsolete.ts' = 'export const obsolete = true;'
        'backend/openapi.yaml' = "openapi: 3.0.0`ninfo:`n  title: Fixture`n  version: 1.0.0`npaths: {}`n"
        'backend/prisma/schema.prisma' = "generator client {`n provider = `"prisma-client-js`"`n}`n"
        'frontend/package.json' = '{"name":"fixture-frontend","version":"1.0.0","scripts":{"build":"vite build"}}'
        'frontend/package-lock.json' = '{"name":"fixture-frontend","lockfileVersion":3,"packages":{}}'
        'frontend/vite.config.ts' = 'export default { build: { outDir: "dist" } };'
        'frontend/index.html' = '<html><body><div id="root"></div></body></html>'
        'frontend/src/main.ts' = 'export const fixture = "frontend-v1";'
        'frontend/public/sw.js' = 'const fixtureCache = "fixture-v1";'
    }
    foreach ($entry in $files.GetEnumerator()) {
        Write-FixtureFile $workspace $entry.Key $entry.Value
        Write-FixtureFile $production $entry.Key $entry.Value
    }
    Write-FixtureFile $production 'backend/dist/index.js' 'original-backend-build'
    Write-FixtureFile $production 'frontend/dist/index.html' 'original-frontend-build'
    Write-FixtureFile $production 'frontend/dist/assets/original-12345678.js' 'original-frontend-asset'
    Write-FixtureFile $production 'backend/uploads/keep.txt' 'fixture runtime upload'
    Write-FixtureFile $production 'backend/logs/keep.log' 'fixture runtime log'
    return [pscustomobject]@{ Root = $root; Workspace = $workspace; Production = $production }
}

function Invoke-FixtureDeployment {
    param($Fixture, [hashtable]$Options = @{})
    $arguments = @{
        WorkspaceRoot = $Fixture.Workspace
        ProductionRoot = $Fixture.Production
        HealthBaseUrl = 'http://127.0.0.1:1'
        PublicBaseUrl = 'http://127.0.0.1:1'
    }
    foreach ($key in $Options.Keys) { $arguments[$key] = $Options[$key] }
    return Invoke-WorkspaceDeployment @arguments
}

function Initialize-DeploymentFixture {
    param($Fixture)
    $result = Invoke-FixtureDeployment $Fixture @{ Initialize = $true }
    Assert-FixtureEqual $result.Status 'Initialized' 'Matching fixture can initialize.'
    Assert-Fixture (Test-Path -LiteralPath (Join-Path $Fixture.Workspace '.deployments/state.json') -PathType Leaf) 'Initialization persists a baseline.'
    return $result
}

function Test-DeploymentCase {
    param([string]$Name, [scriptblock]$Body)
    try {
        & $Body | Out-Null
        $script:TestResults += [pscustomobject]@{ Name = $Name; Passed = $true; Error = $null }
        Write-Host "PASS $Name"
    } catch {
        $script:TestResults += [pscustomobject]@{ Name = $Name; Passed = $false; Error = $_.Exception.Message }
        Write-Host "FAIL $Name : $($_.Exception.Message)" -ForegroundColor Red
    }
}

Test-DeploymentCase 'initialize matching roots and detect no changes' {
    $fixture = New-DeploymentFixture 'initialize'
    $productionBefore = Get-FixtureSnapshot $fixture.Production
    Initialize-DeploymentFixture $fixture | Out-Null
    $result = Invoke-FixtureDeployment $fixture
    Assert-FixtureEqual $result.Status 'NoChanges' 'Unchanged source is reported accurately.'
    Assert-FixtureEqual (Get-FixtureSnapshot $fixture.Production) $productionBefore 'Initialize does not alter production.'
    Assert-FixtureEqual $script:FixtureMocks.Restarts 0 'Initialize does not restart services.'
}

Test-DeploymentCase 'initialize refuses source differences' {
    $fixture = New-DeploymentFixture 'initialize-mismatch'
    Write-FixtureFile $fixture.Production 'frontend/src/main.ts' 'different live source'
    Assert-FixtureThrows { Invoke-FixtureDeployment $fixture @{ Initialize = $true } } 'Mismatched initial source' | Out-Null
    Assert-Fixture (-not (Test-Path -LiteralPath (Join-Path $fixture.Workspace '.deployments/state.json'))) 'Rejected initialize leaves no baseline.'
}

Test-DeploymentCase 'initialize refuses guarded file differences' {
    $fixture = New-DeploymentFixture 'initialize-guarded-mismatch'
    Write-FixtureFile $fixture.Production 'backend/prisma/schema.prisma' 'different live schema'
    Assert-FixtureThrows { Invoke-FixtureDeployment $fixture @{ Initialize = $true } } 'Mismatched initial guarded file' | Out-Null
    Assert-Fixture (-not (Test-Path -LiteralPath (Join-Path $fixture.Workspace '.deployments/state.json'))) 'Rejected guarded baseline is not persisted.'
}

Test-DeploymentCase 'line endings are equivalent for source and protected schema' {
    $fixture = New-DeploymentFixture 'line-ending-equivalence'
    $sourceLf = "export const fixture = 'backend-v1';`nexport const line = 2;`n"
    Write-FixtureFile $fixture.Workspace 'backend/src/index.ts' $sourceLf
    Write-FixtureFile $fixture.Production 'backend/src/index.ts' ($sourceLf.Replace("`n", "`r`n"))
    $schemaLf = Read-FixtureFile $fixture.Workspace 'backend/prisma/schema.prisma'
    Write-FixtureFile $fixture.Production 'backend/prisma/schema.prisma' ($schemaLf.Replace("`n", "`r`n"))
    Initialize-DeploymentFixture $fixture | Out-Null
    Assert-FixtureEqual (Invoke-FixtureDeployment $fixture).Status 'NoChanges' 'Line endings alone are not a source or schema change.'
    Write-FixtureFile $fixture.Workspace 'docs/test-note.md' 'Fixture deployment documentation v2'
    $result = Invoke-FixtureDeployment $fixture @{ Apply = $true }
    Assert-FixtureEqual $result.Status 'Deployed' 'Equivalent source and protected line endings allow an unrelated change.'
    Assert-FixtureEqual (Read-FixtureFile $fixture.Production 'backend/src/index.ts') ($sourceLf.Replace("`n", "`r`n")) 'Unchanged production source retains its line endings.'
    Assert-FixtureEqual (Read-FixtureFile $fixture.Production 'backend/prisma/schema.prisma') ($schemaLf.Replace("`n", "`r`n")) 'Protected schema is not rewritten.'
    Assert-FixtureEqual $script:FixtureMocks.BackendBuilds 0 'Line ending equivalence does not trigger backend build.'
}

Test-DeploymentCase 'preview lists changes without mutation' {
    $fixture = New-DeploymentFixture 'preview'
    Initialize-DeploymentFixture $fixture | Out-Null
    Write-FixtureFile $fixture.Workspace 'frontend/src/main.ts' 'export const fixture = "frontend-v2";'
    $productionBefore = Get-FixtureSnapshot $fixture.Production
    $stateBefore = Read-FixtureFile $fixture.Workspace '.deployments/state.json'
    $result = Invoke-FixtureDeployment $fixture
    Assert-FixtureEqual $result.Status 'Preview' 'Changed source is previewed.'
    Assert-Fixture (@($result.Changes).Count -gt 0) 'Preview includes a change plan.'
    Assert-FixtureEqual (Get-FixtureSnapshot $fixture.Production) $productionBefore 'Preview does not alter production.'
    Assert-FixtureEqual (Read-FixtureFile $fixture.Workspace '.deployments/state.json') $stateBefore 'Preview does not advance baseline.'
    Assert-FixtureEqual $script:FixtureMocks.BuildCalls 0 'Preview does not build.'
    Assert-FixtureEqual $script:FixtureMocks.Restarts 0 'Preview does not restart services.'
}

Test-DeploymentCase 'documentation apply keeps running builds' {
    $fixture = New-DeploymentFixture 'docs-apply'
    Initialize-DeploymentFixture $fixture | Out-Null
    Write-FixtureFile $fixture.Workspace 'docs/test-note.md' 'Fixture deployment documentation v2'
    $backendBefore = Read-FixtureFile $fixture.Production 'backend/dist/index.js'
    $frontendBefore = Read-FixtureFile $fixture.Production 'frontend/dist/index.html'
    $result = Invoke-FixtureDeployment $fixture @{ Apply = $true }
    Assert-FixtureEqual $result.Status 'Deployed' 'Documentation is synchronized.'
    Assert-Fixture (-not [string]::IsNullOrWhiteSpace($result.DeploymentId)) 'Apply returns a rollback identifier.'
    Assert-FixtureEqual (Read-FixtureFile $fixture.Production 'docs/test-note.md') 'Fixture deployment documentation v2' 'Documentation reaches production folder.'
    Assert-FixtureEqual (Read-FixtureFile $fixture.Production 'backend/dist/index.js') $backendBefore 'Documentation keeps backend build.'
    Assert-FixtureEqual (Read-FixtureFile $fixture.Production 'frontend/dist/index.html') $frontendBefore 'Documentation keeps frontend build.'
    Assert-FixtureEqual $script:FixtureMocks.Restarts 0 'Documentation does not restart services.'
    Assert-FixtureEqual $script:FixtureMocks.BackendBuilds 0 'Documentation does not build backend.'
    Assert-FixtureEqual $script:FixtureMocks.FrontendBuilds 0 'Documentation does not build frontend.'
    Assert-FixtureEqual (Invoke-FixtureDeployment $fixture).Status 'NoChanges' 'Successful apply advances baseline.'
}

Test-DeploymentCase 'frontend apply replaces build and preserves runtime files' {
    $fixture = New-DeploymentFixture 'frontend-apply'
    Initialize-DeploymentFixture $fixture | Out-Null
    Write-FixtureFile $fixture.Workspace 'frontend/src/main.ts' 'export const fixture = "frontend-v2";'
    $result = Invoke-FixtureDeployment $fixture @{ Apply = $true }
    Assert-FixtureEqual $result.Status 'Deployed' 'Frontend apply succeeds.'
    Assert-FixtureEqual (Read-FixtureFile $fixture.Production 'frontend/src/main.ts') (Read-FixtureFile $fixture.Workspace 'frontend/src/main.ts') 'Frontend source matches.'
    Assert-FixtureEqual (Read-FixtureFile $fixture.Production 'frontend/dist/index.html') 'fixture-frontend-build-1' 'Built frontend replaces previous output.'
    Assert-FixtureEqual (Read-FixtureFile $fixture.Production 'frontend/dist/assets/original-12345678.js') 'original-frontend-asset' 'Fingerprint assets remain available to existing browser tabs.'
    Assert-FixtureEqual (Read-FixtureFile $fixture.Production 'backend/dist/index.js') 'original-backend-build' 'Frontend leaves backend build intact.'
    Assert-FixtureEqual (Read-FixtureFile $fixture.Production 'backend/uploads/keep.txt') 'fixture runtime upload' 'Runtime uploads remain intact.'
    Assert-FixtureEqual (Read-FixtureFile $fixture.Production 'backend/logs/keep.log') 'fixture runtime log' 'Runtime logs remain intact.'
    Assert-FixtureEqual $script:FixtureMocks.FrontendBuilds 1 'Frontend changes build frontend once.'
    Assert-FixtureEqual $script:FixtureMocks.BackendBuilds 0 'Frontend changes do not build backend.'
    Assert-FixtureEqual $script:FixtureMocks.Restarts 0 'Frontend changes do not restart backend.'
    Assert-FixtureEqual $script:FixtureMocks.Stops 0 'Frontend changes do not stop backend.'
}

Test-DeploymentCase 'backend apply rebuilds and restarts once' {
    $fixture = New-DeploymentFixture 'backend-apply'
    Initialize-DeploymentFixture $fixture | Out-Null
    Write-FixtureFile $fixture.Workspace 'backend/src/index.ts' 'export const fixture = "backend-v2";'
    $result = Invoke-FixtureDeployment $fixture @{ Apply = $true }
    Assert-FixtureEqual $result.Status 'Deployed' 'Backend apply succeeds.'
    Assert-FixtureEqual (Read-FixtureFile $fixture.Production 'backend/src/index.ts') (Read-FixtureFile $fixture.Workspace 'backend/src/index.ts') 'Backend source matches.'
    Assert-FixtureEqual (Read-FixtureFile $fixture.Production 'backend/dist/index.js') 'fixture-backend-build-1' 'Built backend replaces previous output.'
    Assert-FixtureEqual (Read-FixtureFile $fixture.Production 'frontend/dist/index.html') 'original-frontend-build' 'Backend leaves frontend build intact.'
    Assert-FixtureEqual $script:FixtureMocks.BackendBuilds 1 'Backend changes build backend once.'
    Assert-FixtureEqual $script:FixtureMocks.FrontendBuilds 0 'Backend changes do not build frontend.'
    Assert-FixtureEqual $script:FixtureMocks.Restarts 1 'Backend deployment restarts exactly once.'
    Assert-FixtureEqual $script:FixtureMocks.Stops 1 'Backend is stopped before replacing its output.'
    Assert-Fixture ($script:FixtureMocks.HealthChecks -gt 0) 'Deployment performs health validation.'
}

Test-DeploymentCase 'deleted public output is removed while fingerprint assets stay recoverable' {
    $fixture = New-DeploymentFixture 'deleted-public-output'
    Write-FixtureFile $fixture.Workspace 'frontend/public/retired.txt' 'retired public fixture'
    Write-FixtureFile $fixture.Production 'frontend/public/retired.txt' 'retired public fixture'
    Write-FixtureFile $fixture.Production 'frontend/dist/retired.txt' 'retired public fixture'
    Write-FixtureFile $fixture.Production 'frontend/dist/assets/legacy.js' 'unhashed legacy fixture'
    Write-FixtureFile $fixture.Production 'frontend/dist/assets/legacy-1234.js' 'short hash legacy fixture'
    Initialize-DeploymentFixture $fixture | Out-Null
    $productionBefore = Get-FixtureSnapshot $fixture.Production
    Remove-Item -LiteralPath (Join-Path $fixture.Workspace 'frontend/public/retired.txt')
    $result = Invoke-FixtureDeployment $fixture @{ Apply = $true }
    Assert-FixtureEqual $result.Status 'Deployed' 'Public file removal deploys.'
    Assert-Fixture (-not (Test-Path -LiteralPath (Join-Path $fixture.Production 'frontend/public/retired.txt'))) 'Deleted public source is removed in production.'
    Assert-Fixture (-not (Test-Path -LiteralPath (Join-Path $fixture.Production 'frontend/dist/retired.txt'))) 'Deleted public output is removed from live frontend.'
    Assert-Fixture (-not (Test-Path -LiteralPath (Join-Path $fixture.Production 'frontend/dist/assets/legacy.js'))) 'Unhashed stale assets are removed.'
    Assert-Fixture (-not (Test-Path -LiteralPath (Join-Path $fixture.Production 'frontend/dist/assets/legacy-1234.js'))) 'Short suffixes do not qualify as retained fingerprint assets.'
    Assert-FixtureEqual (Read-FixtureFile $fixture.Production 'frontend/dist/assets/original-12345678.js') 'original-frontend-asset' 'Old fingerprint assets with eight hash characters remain available.'
    $rollback = Invoke-FixtureDeployment $fixture @{ Rollback = $result.DeploymentId; Apply = $true }
    Assert-FixtureEqual $rollback.Status 'RolledBack' 'Public output deletion can be rolled back.'
    Assert-FixtureEqual (Get-FixtureSnapshot $fixture.Production) $productionBefore 'Rollback restores all removed public and unhashed assets exactly.'
}

Test-DeploymentCase 'openapi-only update rebuilds and restarts backend' {
    $fixture = New-DeploymentFixture 'openapi-only-update'
    Initialize-DeploymentFixture $fixture | Out-Null
    $changedApi = (Read-FixtureFile $fixture.Workspace 'backend/openapi.yaml') + "`n# fixture API update`n"
    Write-FixtureFile $fixture.Workspace 'backend/openapi.yaml' $changedApi
    $result = Invoke-FixtureDeployment $fixture @{ Apply = $true }
    Assert-FixtureEqual $result.Status 'Deployed' 'OpenAPI update deploys.'
    Assert-FixtureEqual (Read-FixtureFile $fixture.Production 'backend/openapi.yaml') $changedApi 'Updated API document reaches production.'
    Assert-FixtureEqual $script:FixtureMocks.BackendBuilds 1 'OpenAPI changes rebuild backend.'
    Assert-FixtureEqual $script:FixtureMocks.FrontendBuilds 0 'OpenAPI changes leave frontend build alone.'
    Assert-FixtureEqual $script:FixtureMocks.Stops 1 'OpenAPI update stops backend before replacement.'
    Assert-FixtureEqual $script:FixtureMocks.Restarts 1 'OpenAPI update restarts backend to reload startup configuration.'
}

Test-DeploymentCase 'validate builds without copying or restarting' {
    $fixture = New-DeploymentFixture 'validate'
    Initialize-DeploymentFixture $fixture | Out-Null
    Write-FixtureFile $fixture.Workspace 'backend/src/index.ts' 'export const fixture = "backend-v2";'
    Write-FixtureFile $fixture.Workspace 'frontend/src/main.ts' 'export const fixture = "frontend-v2";'
    $productionBefore = Get-FixtureSnapshot $fixture.Production
    $stateBefore = Read-FixtureFile $fixture.Workspace '.deployments/state.json'
    $result = Invoke-FixtureDeployment $fixture @{ Validate = $true }
    Assert-FixtureEqual $result.Status 'Validated' 'Validation reports success.'
    Assert-FixtureEqual $script:FixtureMocks.BackendBuilds 1 'Validation builds changed backend.'
    Assert-FixtureEqual $script:FixtureMocks.FrontendBuilds 1 'Validation builds changed frontend.'
    Assert-FixtureEqual (Get-FixtureSnapshot $fixture.Production) $productionBefore 'Validation leaves production unchanged.'
    Assert-FixtureEqual (Read-FixtureFile $fixture.Workspace '.deployments/state.json') $stateBefore 'Validation leaves baseline unchanged.'
    Assert-FixtureEqual $script:FixtureMocks.Restarts 0 'Validation does not restart services.'
}

Test-DeploymentCase 'build failure leaves production unchanged' {
    $fixture = New-DeploymentFixture 'build-failure'
    Initialize-DeploymentFixture $fixture | Out-Null
    Write-FixtureFile $fixture.Workspace 'backend/src/index.ts' 'export const fixture = "backend-v2";'
    $productionBefore = Get-FixtureSnapshot $fixture.Production
    $stateBefore = Read-FixtureFile $fixture.Workspace '.deployments/state.json'
    $script:FixtureMocks.FailBuild = $true
    Assert-FixtureThrows { Invoke-FixtureDeployment $fixture @{ Apply = $true } } 'Build failure' 'Fixture build failure' | Out-Null
    Assert-FixtureEqual (Get-FixtureSnapshot $fixture.Production) $productionBefore 'Failed build leaves production byte-for-byte unchanged.'
    Assert-FixtureEqual (Read-FixtureFile $fixture.Workspace '.deployments/state.json') $stateBefore 'Failed build keeps baseline.'
    Assert-FixtureEqual $script:FixtureMocks.Restarts 0 'Failed build does not restart services.'
}

Test-DeploymentCase 'validation builds both applications without pending changes' {
    $fixture = New-DeploymentFixture 'validate-no-source-changes'
    Initialize-DeploymentFixture $fixture | Out-Null
    $productionBefore = Get-FixtureSnapshot $fixture.Production
    $result = Invoke-FixtureDeployment $fixture @{ Validate = $true }
    Assert-FixtureEqual $result.Status 'Validated' 'Validation runs with no pending changes.'
    Assert-FixtureEqual $script:FixtureMocks.BackendBuilds 1 'Validation builds backend with no source changes.'
    Assert-FixtureEqual $script:FixtureMocks.FrontendBuilds 1 'Validation builds frontend with no source changes.'
    Assert-FixtureEqual (Get-FixtureSnapshot $fixture.Production) $productionBefore 'Full validation does not alter production.'
    Assert-FixtureEqual $script:FixtureMocks.Stops 0 'Full validation does not stop services.'
}

Test-DeploymentCase 'workspace edits during build abort before production mutation' {
    $fixture = New-DeploymentFixture 'workspace-change-during-build'
    Initialize-DeploymentFixture $fixture | Out-Null
    Write-FixtureFile $fixture.Workspace 'backend/src/index.ts' 'export const fixture = "backend-v2";'
    $productionBefore = Get-FixtureSnapshot $fixture.Production
    $stateBefore = Read-FixtureFile $fixture.Workspace '.deployments/state.json'
    $script:FixtureMocks.EditWorkspaceDuringBuild = $true
    Assert-FixtureThrows { Invoke-FixtureDeployment $fixture @{ Apply = $true } } 'Source changed while staging' 'Workspace source changed while staging' | Out-Null
    Assert-FixtureEqual (Get-FixtureSnapshot $fixture.Production) $productionBefore 'Source edit during staging leaves production unchanged.'
    Assert-FixtureEqual (Read-FixtureFile $fixture.Workspace '.deployments/state.json') $stateBefore 'Source edit during staging keeps prior baseline.'
    Assert-FixtureEqual $script:FixtureMocks.Stops 0 'Staging source edit is detected before service stop.'
    Assert-FixtureEqual $script:FixtureMocks.Restarts 0 'Staging source edit does not restart services.'
}

Test-DeploymentCase 'failed health check restores source and builds' {
    $fixture = New-DeploymentFixture 'health-failure'
    Initialize-DeploymentFixture $fixture | Out-Null
    Write-FixtureFile $fixture.Workspace 'backend/src/index.ts' 'export const fixture = "backend-v2";'
    Write-FixtureFile $fixture.Workspace 'frontend/src/main.ts' 'export const fixture = "frontend-v2";'
    $productionBefore = Get-FixtureSnapshot $fixture.Production
    $script:FixtureMocks.FailHealthAt = $script:FixtureMocks.HealthChecks + 2
    Assert-FixtureThrows { Invoke-FixtureDeployment $fixture @{ Apply = $true } } 'Unhealthy deployment' 'Fixture health failure' | Out-Null
    Assert-FixtureEqual (Get-FixtureSnapshot $fixture.Production) $productionBefore 'Health failure restores complete previous production tree.'
    Assert-FixtureEqual $script:FixtureMocks.Restarts 2 'Failed backend deployment restarts updated and restored service.'
    Assert-Fixture ($script:FixtureMocks.HealthChecks -ge 2) 'Restoration is health checked.'
    Assert-FixtureEqual (Invoke-FixtureDeployment $fixture).Status 'Preview' 'Source remains available to fix and retry after restoration.'
}

Test-DeploymentCase 'direct production drift blocks apply' {
    $fixture = New-DeploymentFixture 'production-drift'
    Initialize-DeploymentFixture $fixture | Out-Null
    Write-FixtureFile $fixture.Production 'frontend/src/main.ts' 'manual production edit'
    Write-FixtureFile $fixture.Workspace 'docs/test-note.md' 'Fixture deployment documentation v2'
    $productionBefore = Get-FixtureSnapshot $fixture.Production
    Assert-FixtureThrows { Invoke-FixtureDeployment $fixture @{ Apply = $true } } 'Production drift' | Out-Null
    Assert-FixtureEqual (Get-FixtureSnapshot $fixture.Production) $productionBefore 'Drift rejection does not overwrite direct production edit.'
    Assert-FixtureEqual $script:FixtureMocks.Restarts 0 'Drift rejection does not restart services.'
}

Test-DeploymentCase 'schema and dependency changes require separate handling' {
    $guardedPaths = @('backend/prisma/schema.prisma', 'backend/package.json', 'frontend/package.json', 'package.json', 'backend/package-lock.json', 'frontend/package-lock.json')
    foreach ($guardedPath in $guardedPaths) {
        $fixture = New-DeploymentFixture ('guarded-' + $guardedPath.Replace('/', '-').Replace('.', '-'))
        Initialize-DeploymentFixture $fixture | Out-Null
        Write-FixtureFile $fixture.Workspace $guardedPath ((Read-FixtureFile $fixture.Workspace $guardedPath) + "`nfixture protected change")
        $productionBefore = Get-FixtureSnapshot $fixture.Production
        Assert-FixtureThrows { Invoke-FixtureDeployment $fixture @{ Apply = $true } } "Guarded file $guardedPath" | Out-Null
        Assert-FixtureEqual (Get-FixtureSnapshot $fixture.Production) $productionBefore "Guarded rejection leaves production intact: $guardedPath"
        Assert-FixtureEqual $script:FixtureMocks.BuildCalls 0 "Guarded changes are rejected before build: $guardedPath"
        Assert-FixtureEqual $script:FixtureMocks.Restarts 0 "Guarded changes do not restart services: $guardedPath"
    }
}

Test-DeploymentCase 'source deletion is applied and recoverable' {
    $fixture = New-DeploymentFixture 'source-deletion'
    Initialize-DeploymentFixture $fixture | Out-Null
    $original = Read-FixtureFile $fixture.Production 'backend/src/obsolete.ts'
    Remove-Item -LiteralPath (Join-Path $fixture.Workspace 'backend/src/obsolete.ts')
    $result = Invoke-FixtureDeployment $fixture @{ Apply = $true }
    Assert-FixtureEqual $result.Status 'Deployed' 'Tracked source deletion deploys.'
    Assert-Fixture (-not (Test-Path -LiteralPath (Join-Path $fixture.Production 'backend/src/obsolete.ts'))) 'Deleted source is absent in production.'
    $rollback = Invoke-FixtureDeployment $fixture @{ Rollback = $result.DeploymentId; Apply = $true }
    Assert-FixtureEqual $rollback.Status 'RolledBack' 'Deletion rollback succeeds.'
    Assert-FixtureEqual (Read-FixtureFile $fixture.Production 'backend/src/obsolete.ts') $original 'Rollback restores deleted production source.'
    Assert-FixtureEqual (Read-FixtureFile $fixture.Production 'backend/dist/index.js') 'original-backend-build' 'Rollback restores prior backend build.'
    Assert-Fixture (-not (Test-Path -LiteralPath (Join-Path $fixture.Workspace 'backend/src/obsolete.ts'))) 'Rollback preserves developer workspace deletion.'
    Assert-FixtureEqual (Invoke-FixtureDeployment $fixture).Status 'Preview' 'Workspace changes remain pending after rollback.'
}

Test-DeploymentCase 'rollback refuses conflicts in production' {
    $fixture = New-DeploymentFixture 'rollback-conflict'
    Initialize-DeploymentFixture $fixture | Out-Null
    Write-FixtureFile $fixture.Workspace 'frontend/src/main.ts' 'export const fixture = "frontend-v2";'
    $result = Invoke-FixtureDeployment $fixture @{ Apply = $true }
    Write-FixtureFile $fixture.Production 'frontend/src/main.ts' 'manual edit after deployment'
    $productionBefore = Get-FixtureSnapshot $fixture.Production
    $restartCountBefore = $script:FixtureMocks.Restarts
    Assert-FixtureThrows { Invoke-FixtureDeployment $fixture @{ Rollback = $result.DeploymentId; Apply = $true } } 'Rollback with conflicting direct production edit' | Out-Null
    Assert-FixtureEqual (Get-FixtureSnapshot $fixture.Production) $productionBefore 'Conflicting rollback preserves production files.'
    Assert-FixtureEqual $script:FixtureMocks.Restarts $restartCountBefore 'Conflicting rollback does not restart services.'
}

Test-DeploymentCase 'rollback preserves pending workspace schema edits' {
    $fixture = New-DeploymentFixture 'rollback-pending-schema'
    Initialize-DeploymentFixture $fixture | Out-Null
    Write-FixtureFile $fixture.Workspace 'backend/src/index.ts' 'export const fixture = "backend-v2";'
    $result = Invoke-FixtureDeployment $fixture @{ Apply = $true }
    $originalSchema = Read-FixtureFile $fixture.Production 'backend/prisma/schema.prisma'
    $pendingSchema = $originalSchema + "`n// pending workspace schema edit"
    Write-FixtureFile $fixture.Workspace 'backend/prisma/schema.prisma' $pendingSchema
    $rollback = Invoke-FixtureDeployment $fixture @{ Rollback = $result.DeploymentId; Apply = $true }
    Assert-FixtureEqual $rollback.Status 'RolledBack' 'Pending local schema change does not block production rollback.'
    Assert-FixtureEqual (Read-FixtureFile $fixture.Workspace 'backend/prisma/schema.prisma') $pendingSchema 'Rollback preserves pending workspace schema.'
    Assert-FixtureEqual (Read-FixtureFile $fixture.Production 'backend/prisma/schema.prisma') $originalSchema 'Rollback does not deploy pending schema.'
    Assert-FixtureEqual (Read-FixtureFile $fixture.Production 'backend/src/index.ts') 'export const fixture = "backend-v1";' 'Rollback restores original production source.'
}

Test-DeploymentCase 'only latest successful deployment can be rolled back' {
    $fixture = New-DeploymentFixture 'rollback-latest-only'
    Initialize-DeploymentFixture $fixture | Out-Null
    Write-FixtureFile $fixture.Workspace 'docs/test-note.md' 'Fixture deployment documentation v2'
    $first = Invoke-FixtureDeployment $fixture @{ Apply = $true }
    Write-FixtureFile $fixture.Workspace 'docs/test-note.md' 'Fixture deployment documentation v3'
    Invoke-FixtureDeployment $fixture @{ Apply = $true } | Out-Null
    $productionBefore = Get-FixtureSnapshot $fixture.Production
    Assert-FixtureThrows { Invoke-FixtureDeployment $fixture @{ Rollback = $first.DeploymentId; Apply = $true } } 'Older deployment rollback' | Out-Null
    Assert-FixtureEqual (Get-FixtureSnapshot $fixture.Production) $productionBefore 'Rejected older rollback preserves production.'
}

Test-DeploymentCase 'rollback refuses corrupted backup before mutation' {
    $fixture = New-DeploymentFixture 'rollback-corrupted-backup'
    Initialize-DeploymentFixture $fixture | Out-Null
    Write-FixtureFile $fixture.Workspace 'backend/src/index.ts' 'export const fixture = "backend-v2";'
    $result = Invoke-FixtureDeployment $fixture @{ Apply = $true }
    Write-FixtureFile $fixture.Workspace ('.deployments/{0}/before/backend/src/index.ts' -f $result.DeploymentId) 'corrupted fixture backup'
    $productionBefore = Get-FixtureSnapshot $fixture.Production
    $stopsBefore = $script:FixtureMocks.Stops
    $restartsBefore = $script:FixtureMocks.Restarts
    Assert-FixtureThrows { Invoke-FixtureDeployment $fixture @{ Rollback = $result.DeploymentId; Apply = $true } } 'Corrupted rollback backup' 'Backup verification failed' | Out-Null
    Assert-FixtureEqual (Get-FixtureSnapshot $fixture.Production) $productionBefore 'Corrupt backup is not copied into production.'
    Assert-FixtureEqual $script:FixtureMocks.Stops $stopsBefore 'Corrupt backup is rejected before stopping backend.'
    Assert-FixtureEqual $script:FixtureMocks.Restarts $restartsBefore 'Corrupt backup is rejected without restarting backend.'
}

Test-DeploymentCase 'rollback rejects manifest traversal' {
    $fixture = New-DeploymentFixture 'rollback-path-traversal'
    Initialize-DeploymentFixture $fixture | Out-Null
    Write-FixtureFile $fixture.Workspace 'docs/test-note.md' 'Fixture deployment documentation v2'
    $result = Invoke-FixtureDeployment $fixture @{ Apply = $true }
    Write-FixtureFile $fixture.Root 'outside.txt' 'fixture traversal sentinel'
    $manifestPath = '.deployments/{0}/manifest.json' -f $result.DeploymentId
    $manifest = Read-FixtureFile $fixture.Workspace $manifestPath | ConvertFrom-Json
    $manifest.Operations[0].Path = '../outside.txt'
    Write-FixtureFile $fixture.Workspace $manifestPath ($manifest | ConvertTo-Json -Depth 20)
    $productionBefore = Get-FixtureSnapshot $fixture.Production
    Assert-FixtureThrows { Invoke-FixtureDeployment $fixture @{ Rollback = $result.DeploymentId; Apply = $true } } 'Traversal in rollback manifest' 'unmanaged path|Invalid relative path' | Out-Null
    Assert-FixtureEqual (Get-FixtureSnapshot $fixture.Production) $productionBefore 'Traversal rejection preserves production.'
    Assert-FixtureEqual (Read-FixtureFile $fixture.Root 'outside.txt') 'fixture traversal sentinel' 'Traversal rejection preserves outside file.'
}

Test-DeploymentCase 'failed rollback health restores deployed version' {
    $fixture = New-DeploymentFixture 'rollback-health-recovery'
    Initialize-DeploymentFixture $fixture | Out-Null
    Write-FixtureFile $fixture.Workspace 'backend/src/index.ts' 'export const fixture = "backend-v2";'
    $result = Invoke-FixtureDeployment $fixture @{ Apply = $true }
    $productionBefore = Get-FixtureSnapshot $fixture.Production
    $restartCountBefore = $script:FixtureMocks.Restarts
    $script:FixtureMocks.FailHealthAt = $script:FixtureMocks.HealthChecks + 1
    Assert-FixtureThrows { Invoke-FixtureDeployment $fixture @{ Rollback = $result.DeploymentId; Apply = $true } } 'Unhealthy rollback' 'Fixture health failure' | Out-Null
    Assert-FixtureEqual (Get-FixtureSnapshot $fixture.Production) $productionBefore 'Failed rollback restores complete deployed version.'
    Assert-FixtureEqual $script:FixtureMocks.Restarts ($restartCountBefore + 2) 'Failed backend rollback restarts restored and recovered version.'
    Assert-FixtureEqual (Invoke-FixtureDeployment $fixture).Status 'NoChanges' 'Failed rollback keeps the deployed baseline.'
    $retry = Invoke-FixtureDeployment $fixture @{ Rollback = $result.DeploymentId; Apply = $true }
    Assert-FixtureEqual $retry.Status 'RolledBack' 'Rollback remains retryable after successful recovery.'
}

Test-DeploymentCase 'held workspace deployment lock rejects concurrent apply' {
    $fixture = New-DeploymentFixture 'deployment-lock'
    Initialize-DeploymentFixture $fixture | Out-Null
    Write-FixtureFile $fixture.Workspace 'backend/src/index.ts' 'export const fixture = "backend-v2";'
    $productionBefore = Get-FixtureSnapshot $fixture.Production
    $lockPath = Join-Path $fixture.Workspace '.deployments/deployment.lock'
    $heldLock = [System.IO.File]::Open($lockPath, 'OpenOrCreate', 'ReadWrite', 'None')
    try {
        Assert-FixtureThrows { Invoke-FixtureDeployment $fixture @{ Apply = $true } } 'Held deployment lock' 'Another.*running' | Out-Null
    } finally { $heldLock.Dispose() }
    Assert-FixtureEqual (Get-FixtureSnapshot $fixture.Production) $productionBefore 'Concurrent apply rejection leaves production unchanged.'
    Assert-FixtureEqual $script:FixtureMocks.BuildCalls 0 'Concurrent apply rejection occurs before build.'
    Assert-FixtureEqual $script:FixtureMocks.Restarts 0 'Concurrent apply rejection does not restart services.'
}

Test-DeploymentCase 'different workspaces share one production machine lock' {
    $fixture = New-DeploymentFixture 'machine-lock-two-workspaces'
    $secondWorkspace = Join-Path $fixture.Root 'w2'
    Copy-Item -LiteralPath $fixture.Workspace -Destination $secondWorkspace -Recurse
    $secondFixture = [pscustomobject]@{ Workspace = $secondWorkspace; Production = $fixture.Production }
    Initialize-DeploymentFixture $fixture | Out-Null
    Initialize-DeploymentFixture $secondFixture | Out-Null
    Write-FixtureFile $fixture.Workspace 'docs/test-note.md' 'first workspace change'
    Write-FixtureFile $secondWorkspace 'docs/test-note.md' 'second workspace change'
    $productionBefore = Get-FixtureSnapshot $fixture.Production
    $eventKey = [guid]::NewGuid().ToString('N')
    $readyName = 'Local\AtivaFixtureReady-' + $eventKey
    $releaseName = 'Local\AtivaFixtureRelease-' + $eventKey
    $readyEvent = New-Object System.Threading.EventWaitHandle($false, [System.Threading.EventResetMode]::ManualReset, $readyName)
    $releaseEvent = New-Object System.Threading.EventWaitHandle($false, [System.Threading.EventResetMode]::ManualReset, $releaseName)
    $background = [PowerShell]::Create()
    $pending = $null
    $backgroundError = ''
    $worker = @'
param($Helper, $Workspace, $Production, $ReadyName, $ReleaseName)
. $Helper -LibraryOnly
$script:FixtureReadyName = $ReadyName
$script:FixtureReleaseName = $ReleaseName
function Assert-DeploymentService { param($Context) }
function Assert-DeploymentHealth { param($Context, [bool]$CheckFrontend) }
function Stop-DeploymentService { param($Context) }
function Restart-DeploymentService { param($Context) }
function Invoke-StageBuild {
    param($Context, [string]$StageRoot, [bool]$BuildBackend, [bool]$BuildFrontend)
    $ready = [System.Threading.EventWaitHandle]::OpenExisting($script:FixtureReadyName)
    $release = [System.Threading.EventWaitHandle]::OpenExisting($script:FixtureReleaseName)
    try {
        $ready.Set() | Out-Null
        if (-not $release.WaitOne(15000)) { throw 'Fixture blocked deployment timed out' }
    } finally { $ready.Dispose(); $release.Dispose() }
    throw 'Fixture blocked deployment released'
}
Invoke-WorkspaceDeployment -WorkspaceRoot $Workspace -ProductionRoot $Production -Apply -HealthBaseUrl 'http://127.0.0.1:1' -PublicBaseUrl ''
'@
    try {
        $background.AddScript($worker).AddArgument($HelperPath).AddArgument($fixture.Workspace).AddArgument($fixture.Production).AddArgument($readyName).AddArgument($releaseName) | Out-Null
        $pending = $background.BeginInvoke()
        Assert-Fixture ($readyEvent.WaitOne(10000)) 'First workspace acquired machine lock and reached fixture build.'
        Assert-FixtureThrows { Invoke-FixtureDeployment $secondFixture @{ Apply = $true } } 'Two workspaces targeting one production' 'Another deployment.*production directory' | Out-Null
        Assert-FixtureEqual (Get-FixtureSnapshot $fixture.Production) $productionBefore 'Shared production lock rejects second workspace before mutation.'
    } finally {
        $releaseEvent.Set() | Out-Null
        if ($null -ne $pending) {
            try { $background.EndInvoke($pending) | Out-Null } catch { $backgroundError = $_.Exception.Message }
        }
        $background.Dispose()
        $readyEvent.Dispose()
        $releaseEvent.Dispose()
    }
    Assert-Fixture ($backgroundError -match 'Fixture blocked deployment released') 'Background fixture deployment exited at mocked build boundary.'
    Assert-FixtureEqual (Get-FixtureSnapshot $fixture.Production) $productionBefore 'Neither competing workspace altered production.'
}

Test-DeploymentCase 'apply needs baseline and rejects invalid operation modes' {
    $fixture = New-DeploymentFixture 'invalid-modes'
    $productionBefore = Get-FixtureSnapshot $fixture.Production
    Assert-FixtureThrows { Invoke-FixtureDeployment $fixture @{ Apply = $true } } 'Apply without baseline' | Out-Null
    Assert-FixtureThrows { Invoke-FixtureDeployment $fixture @{ Initialize = $true; Apply = $true } } 'Initialize with apply' | Out-Null
    Assert-FixtureThrows { Invoke-FixtureDeployment $fixture @{ Validate = $true; Apply = $true } } 'Validate with apply' | Out-Null
    Initialize-DeploymentFixture $fixture | Out-Null
    Assert-FixtureThrows { Invoke-FixtureDeployment $fixture @{ Rollback = '../../outside'; Apply = $true } } 'Invalid rollback identifier' | Out-Null
    Assert-FixtureEqual (Get-FixtureSnapshot $fixture.Production) $productionBefore 'Rejected modes leave production untouched.'
}

Test-DeploymentCase 'identical and overlapping roots are forbidden' {
    $fixture = New-DeploymentFixture 'overlapping-roots'
    foreach ($roots in @(
        @{ WorkspaceRoot = $fixture.Workspace; ProductionRoot = $fixture.Workspace },
        @{ WorkspaceRoot = $fixture.Workspace; ProductionRoot = (Join-Path $fixture.Workspace 'nested-production') },
        @{ WorkspaceRoot = $fixture.Root; ProductionRoot = $fixture.Workspace }
    )) {
        Assert-FixtureThrows { Invoke-WorkspaceDeployment @roots -Initialize -HealthBaseUrl 'http://127.0.0.1:1' -PublicBaseUrl 'http://127.0.0.1:1' } 'Identical or overlapping roots' | Out-Null
    }
    Assert-FixtureEqual $script:FixtureMocks.Restarts 0 'Invalid roots never reach service mutation.'
}

$failed = @($script:TestResults | Where-Object { -not $_.Passed })
Write-Host ('Deployment fixture checks: {0} passed, {1} failed.' -f ($script:TestResults.Count - $failed.Count), $failed.Count)
Write-Host "Fixtures retained: $script:TestRunRoot"
if ($failed.Count -gt 0) {
    throw ('Deployment fixture checks failed: ' + (($failed | ForEach-Object { $_.Name }) -join '; '))
}
