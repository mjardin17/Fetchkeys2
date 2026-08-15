$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$destination = Join-Path $PSScriptRoot "backups\$stamp"
New-Item -ItemType Directory -Force $destination | Out-Null
docker compose cp bosskey:/data $destination
Write-Host "Encrypted local data copied to $destination"