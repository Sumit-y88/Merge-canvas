param(
  [string]$OutputDirectory = ".\backups"
)

$ErrorActionPreference = "Stop"
if (-not $env:MONGODB_URI) { throw "MONGODB_URI must be set" }

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$target = Join-Path (Resolve-Path $OutputDirectory) "mergecanvas-$timestamp"
New-Item -ItemType Directory -Path $target -Force | Out-Null
mongodump --uri="$env:MONGODB_URI" --out="$target"
Write-Output "MongoDB backup created at $target"
