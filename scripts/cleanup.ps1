#!/usr/bin/env pwsh
# Cross-Platform Cleanup Script for Tools Hub (Native PowerShell / Windows)
# Usage: ./scripts/cleanup.ps1 [feature-name] [-TaskId <id>] [-NoMerge] [-MergeMethod <squash|merge|rebase>] [-Base <branch>]
param(
    [Parameter(Position=0)]
    [string]$Feature,
    [Parameter()]
    [string]$TaskId,
    [Parameter()]
    [switch]$NoMerge,
    [Parameter()]
    [ValidateSet("squash", "merge", "rebase")]
    [string]$MergeMethod = "squash",
    [Parameter()]
    [string]$Base = "main"
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$pythonCmd = if (Get-Command python -ErrorAction SilentlyContinue) { "python" } elseif (Get-Command python3 -ErrorAction SilentlyContinue) { "python3" } else { "py" }

$scriptArgs = @("$PSScriptRoot/tool_sprint.py", "cleanup")
if ($Feature) { $scriptArgs += $Feature }
if ($TaskId) { $scriptArgs += @("--task-id", $TaskId) }
if ($NoMerge) { $scriptArgs += "--no-merge" }
if ($MergeMethod) { $scriptArgs += @("--merge-method", $MergeMethod) }
if ($Base) { $scriptArgs += @("--base", $Base) }

& $pythonCmd $scriptArgs
exit $LASTEXITCODE
