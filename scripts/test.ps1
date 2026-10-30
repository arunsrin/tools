#!/usr/bin/env pwsh
# Strict test suite for Tools Hub (Native PowerShell / Windows)
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Refresh PATH from registry so newly installed CLI tools are immediately discoverable
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

$pythonCmd = if (Get-Command python -ErrorAction SilentlyContinue) { "python" } elseif (Get-Command python3 -ErrorAction SilentlyContinue) { "python3" } else { "py" }

Write-Host "=== 1. TypeScript & Vite Production Build ===" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed!"
    exit $LASTEXITCODE
}
Write-Host "[OK] Production build successful" -ForegroundColor Green

Write-Host "`n=== 2. ESLint Static Analysis ===" -ForegroundColor Cyan
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Error "Lint check failed!"
    exit $LASTEXITCODE
}
Write-Host "[OK] ESLint clean" -ForegroundColor Green

Write-Host "`n=== 3. Vitest Component & Unit Tests with Coverage ===" -ForegroundColor Cyan
npm run coverage
if ($LASTEXITCODE -ne 0) {
    Write-Error "Unit / component tests failed!"
    exit $LASTEXITCODE
}
Write-Host "[OK] Test suite and coverage passed" -ForegroundColor Green

Write-Host "`n=== 4. Validating CI Parity ===" -ForegroundColor Cyan
& $pythonCmd "$PSScriptRoot/test_ci_parity.py"
if ($LASTEXITCODE -ne 0) {
    Write-Error "CI Parity validation failed! Local tests must align with .github/workflows/test.yml"
    exit $LASTEXITCODE
}
Write-Host "[OK] CI parity verified" -ForegroundColor Green

Write-Host "`n=== 5. Validating Modular Tool Structure & Specs ===" -ForegroundColor Cyan
& $pythonCmd "$PSScriptRoot/test_tools_structure.py"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Tools structure validation failed!"
    exit $LASTEXITCODE
}
Write-Host "[OK] Tool structure and specs verified" -ForegroundColor Green

Write-Host "`n=== 6. Validating Sprint Cleanup Tooling ===" -ForegroundColor Cyan
& $pythonCmd "$PSScriptRoot/test_cleanup_tooling.py"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Sprint cleanup tooling validation failed!"
    exit $LASTEXITCODE
}
Write-Host "[OK] Sprint cleanup tooling verified" -ForegroundColor Green

Write-Host "`n===============================================" -ForegroundColor Green
Write-Host " All strict verification checks passed (100% green)" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
