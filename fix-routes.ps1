# PowerShell script to fix all navigation routes by adding /app prefix

$frontendPath = "c:\AI Websites\Sidharth Gold Inventory Site\frontend\src"

# Define the patterns to replace
$patterns = @(
    @{ Old = "navigate\('\/inventory\/"; New = "navigate('/app/inventory/" }
    @{ Old = "navigate\('\/payroll'"; New = "navigate('/app/payroll'" }
    @{ Old = "navigate\('\/payroll\/"; New = "navigate('/app/payroll/" }
    @{ Old = 'navigate\("\/inventory\/'; New = 'navigate("/app/inventory/' }
    @{ Old = 'navigate\("\/payroll"'; New = 'navigate("/app/payroll"' }
    @{ Old = 'navigate\("\/payroll\/'; New = 'navigate("/app/payroll/' }
    @{ Old = "onClick=\{\(\) => navigate\('\/inventory\/"; New = "onClick={() => navigate('/app/inventory/" }
    @{ Old = "onClick=\{\(\) => navigate\('\/payroll'"; New = "onClick={() => navigate('/app/payroll'" }
    @{ Old = 'to="\/inventory\/'; New = 'to="/app/inventory/' }
    @{ Old = 'to="\/payroll"'; New = 'to="/app/payroll"' }
    @{ Old = 'to="\/payroll\/'; New = 'to="/app/payroll/' }
    @{ Old = 'to="\/dashboard"'; New = 'to="/app/dashboard"' }
    @{ Old = 'to="\/orders"'; New = 'to="/app/orders"' }
    @{ Old = 'to="\/orders\/'; New = 'to="/app/orders/' }
    @{ Old = 'to="\/factory"'; New = 'to="/app/factory"' }
    @{ Old = 'to="\/users"'; New = 'to="/app/users"' }
    @{ Old = 'to="\/departments"'; New = 'to="/app/departments"' }
    @{ Old = 'to="\/departments\/'; New = 'to="/app/departments/' }
    @{ Old = 'to="\/reports"'; New = 'to="/app/reports"' }
    @{ Old = 'to="\/submissions"'; New = 'to="/app/submissions"' }
    @{ Old = 'to="\/my-work"'; New = 'to="/app/my-work"' }
    @{ Old = 'to="\/admin\/'; New = 'to="/app/admin/' }
    @{ Old = 'to="\/attendance\/'; New = 'to="/app/attendance/' }
)

# Get all TypeScript and TSX files
$files = Get-ChildItem -Path $frontendPath -Recurse -Include "*.tsx","*.ts" -Exclude "*.d.ts"

$updatedCount = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $fileUpdated = $false
    
    foreach ($pattern in $patterns) {
        if ($content -match $pattern.Old) {
            $content = $content -replace $pattern.Old, $pattern.New
            $fileUpdated = $true
        }
    }
    
    if ($fileUpdated -and $content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.FullName)" -ForegroundColor Green
        $updatedCount++
    }
}

Write-Host "`nTotal files updated: $updatedCount" -ForegroundColor Cyan
Write-Host "Route fix complete!" -ForegroundColor Green
