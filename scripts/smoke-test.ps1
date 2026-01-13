# ===============================================================================
# Smoke Test Script - Gold Factory Inventory (PowerShell)
# Tests critical user flows after deployment
#
# Usage: .\scripts\smoke-test.ps1 [environment]
# Example: .\scripts\smoke-test.ps1 production
# ===============================================================================

param(
    [string]$Environment = "development"
)

# Configuration
switch ($Environment) {
    "production" {
        $ApiUrl = if ($env:PROD_API_URL) { $env:PROD_API_URL } else { "https://api.goldfactory.com" }
        $FrontendUrl = if ($env:PROD_FRONTEND_URL) { $env:PROD_FRONTEND_URL } else { "https://goldfactory.com" }
    }
    "staging" {
        $ApiUrl = if ($env:STAGING_API_URL) { $env:STAGING_API_URL } else { "https://staging-api.goldfactory.com" }
        $FrontendUrl = if ($env:STAGING_FRONTEND_URL) { $env:STAGING_FRONTEND_URL } else { "https://staging.goldfactory.com" }
    }
    default {
        $ApiUrl = if ($env:API_URL) { $env:API_URL } else { "http://localhost:3000" }
        $FrontendUrl = if ($env:FRONTEND_URL) { $env:FRONTEND_URL } else { "http://localhost:5173" }
    }
}

# Test credentials
$TestEmail = if ($env:TEST_USER_EMAIL) { $env:TEST_USER_EMAIL } else { "sidharth.goel@goldfactory.com" }
$TestPassword = if ($env:TEST_USER_PASSWORD) { $env:TEST_USER_PASSWORD } else { "Password@123" }

# Results
$Passed = 0
$Failed = 0
$Tests = @()

# ===============================================================================
# Utility Functions
# ===============================================================================

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "------------------------------------------------------------" -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor Cyan
    Write-Host "------------------------------------------------------------" -ForegroundColor Cyan
    Write-Host ""
}

function Pass {
    param([string]$Message)
    Write-Host "[PASS] $Message" -ForegroundColor Green
    $script:Passed++
    $script:Tests += "PASS: $Message"
}

function Fail {
    param([string]$Message)
    Write-Host "[FAIL] $Message" -ForegroundColor Red
    $script:Failed++
    $script:Tests += "FAIL: $Message"
}

function Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

# ===============================================================================
# Test Functions
# ===============================================================================

function Test-HealthCheck {
    Write-Section "Health Check"
    
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-WebRequest -Uri "$ApiUrl/health" -Method GET -UseBasicParsing -ErrorAction Stop
        $stopwatch.Stop()
        $duration = $stopwatch.ElapsedMilliseconds
        
        if ($response.StatusCode -eq 200) {
            Pass "API health check ($duration ms)"
        } else {
            Fail "API health check (status: $($response.StatusCode))"
            return $false
        }
        
        if ($duration -lt 100) {
            Pass "Response time acceptable ($duration ms)"
        } elseif ($duration -lt 500) {
            Warn "Response time slow ($duration ms)"
            $script:Passed++
        } else {
            Fail "Response time too slow ($duration ms)"
        }
        
        return $true
    } catch {
        Fail "API health check (error: $($_.Exception.Message))"
        return $false
    }
}

function Test-Frontend {
    Write-Section "Frontend"
    
    try {
        $response = Invoke-WebRequest -Uri $FrontendUrl -Method GET -UseBasicParsing -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Pass "Frontend accessible"
            
            if ($response.Content -match "<div id=`"root`">") {
                Pass "React app marker found"
            } else {
                Warn "React app marker not found (may be normal)"
            }
        } else {
            Fail "Frontend not accessible (status: $($response.StatusCode))"
            return $false
        }
        
        return $true
    } catch {
        Fail "Frontend not accessible (error: $($_.Exception.Message))"
        return $false
    }
}

function Test-Authentication {
    Write-Section "Authentication"
    
    try {
        $body = @{
            email = $TestEmail
            password = $TestPassword
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "$ApiUrl/api/auth/login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Pass "Login successful"
            
            $data = $response.Content | ConvertFrom-Json
            
            if ($data.data.tokens.accessToken) {
                Pass "Access token received"
                return $data.data.tokens.accessToken
            } else {
                Fail "Access token not in response"
                return $null
            }
        } else {
            Fail "Login failed (status: $($response.StatusCode))"
            return $null
        }
    } catch {
        Fail "Login failed (error: $($_.Exception.Message))"
        return $null
    }
}

function Test-OrdersList {
    param([string]$Token)
    
    Write-Section "Orders API"
    
    if (-not $Token) {
        Warn "Skipping orders test (no auth token)"
        return
    }
    
    try {
        $headers = @{
            "Authorization" = "Bearer $Token"
        }
        
        $response = Invoke-WebRequest -Uri "$ApiUrl/api/orders" -Method GET -Headers $headers -UseBasicParsing -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Pass "Orders list accessible"
            
            $data = $response.Content | ConvertFrom-Json
            
            if ($data.data -and $data.data.Count -ge 0) {
                Pass "Orders data returned ($($data.data.Count) orders)"
            }
        } else {
            Fail "Orders list failed (status: $($response.StatusCode))"
        }
    } catch {
        Fail "Orders list failed (error: $($_.Exception.Message))"
    }
}

function Test-DatabaseHealth {
    Write-Section "Database Health"
    
    try {
        $response = Invoke-WebRequest -Uri "$ApiUrl/health/detailed" -Method GET -UseBasicParsing -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            $data = $response.Content | ConvertFrom-Json
            
            if ($data.checks.database.status -eq "up") {
                Pass "Database connected"
            } else {
                Fail "Database not connected"
            }
            
            if ($data.checks.memory.status -eq "up") {
                Pass "Memory usage healthy"
            } else {
                Warn "Memory usage high"
            }
        } else {
            Fail "Detailed health check failed (status: $($response.StatusCode))"
        }
    } catch {
        Fail "Detailed health check failed (error: $($_.Exception.Message))"
    }
}

# ===============================================================================
# Main
# ===============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "         SMOKE TEST - Gold Factory Inventory                " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Environment: $Environment"
Write-Host "API URL: $ApiUrl"
Write-Host "Frontend URL: $FrontendUrl"
Write-Host "Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host ""

# Run tests
Test-HealthCheck | Out-Null
Test-Frontend | Out-Null
$token = Test-Authentication
Test-OrdersList -Token $token
Test-DatabaseHealth

# Summary
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  SMOKE TEST SUMMARY" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Passed: $Passed" -ForegroundColor Green
Write-Host "Failed: $Failed" -ForegroundColor Red
Write-Host "-------------------------------"
Write-Host "Total:  $($Passed + $Failed)"
Write-Host ""

if ($Failed -eq 0) {
    Write-Host "[SUCCESS] ALL SMOKE TESTS PASSED" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[FAILURE] SMOKE TESTS FAILED - $Failed issue(s)" -ForegroundColor Red
    exit 1
}
