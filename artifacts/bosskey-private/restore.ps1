$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$source = Read-Host "Enter the backup folder path"
if (-not (Test-Path $source)) { throw "Backup folder does not exist: $source" }
$confirm = Read-Host "This replaces current local data. Type RESTORE to continue"
if ($confirm -ne "RESTORE") { Write-Host "Restore cancelled"; exit 0 }
docker compose stop
docker compose cp "$source\data\." bosskey:/data
docker compose start
Write-Host "Restore completed. Verify the local health endpoint before unlocking the vault."