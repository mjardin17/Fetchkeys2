$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
docker compose up -d --build
Write-Host "BossKey Private is available at http://127.0.0.1:4789"