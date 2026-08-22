$mistakesPath = "E:\Games\Ragnarok\rathena-solo-centric\MISTAKES_AND_LEARNINGS.md"
if (Test-Path $mistakesPath) {
    $content = Get-Content -Path $mistakesPath -Raw
    $obj = @{
        injectSteps = @(
            @{
                ephemeralMessage = "CRITICAL PAST MISTAKES (DO NOT REPEAT):`n`n" + $content
            }
        )
    }
    $obj | ConvertTo-Json -Depth 10 -Compress | Write-Output
} else {
    Write-Output '{}'
}
