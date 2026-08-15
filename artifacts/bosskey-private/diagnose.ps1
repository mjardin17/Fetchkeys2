$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
docker compose ps
try {
  $health = Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4789/api/healthz
  Write-Host "Health: $($health.StatusCode) $($health.Content)"
} catch {
  Write-Warning "Health check failed: $($_.Exception.Message)"
}
docker compose logs --tail=200