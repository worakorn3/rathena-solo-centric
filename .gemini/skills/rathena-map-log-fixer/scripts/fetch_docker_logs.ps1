param (
    [string]$ContainerName = "rathena-map",
    [int]$LinesToTail = 500
)

Write-Host "Fetching last $LinesToTail lines from container: $ContainerName" -ForegroundColor Cyan
Write-Host "Filtering for [Error] and [Warning] related to scripts..." -ForegroundColor Cyan
Write-Host "--------------------------------------------------------"

# Use docker logs and filter for common script error identifiers
# -ErrorAction Ignore for docker logs to prevent PS errors if the container doesn't exist.
# -match for regex filtering.
try {
    $logs = docker logs --tail $LinesToTail $ContainerName 2>&1
    $logs | Where-Object { $_ -match '\[Error\]|\[Warning\]' } | Where-Object { $_ -match 'script|buildin|parse_script|npc' }
} catch {
    Write-Error "Failed to fetch docker logs for $ContainerName"
}

Write-Host "--------------------------------------------------------"
Write-Host "Done."
