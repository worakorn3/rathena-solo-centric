# PowerShell context loader for Windows
# Reads distilled HOT mistakes and action items into agent context (< 350 tokens)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$hotPath = Join-Path $scriptDir "..\MISTAKES_AND_LEARNINGS.md"

if (Test-Path $hotPath) {
    Get-Content -Path $hotPath -Raw
}
