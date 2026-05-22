#!/usr/bin/env pwsh
<#
  Prints 14-digit migration version prefixes from supabase/migrations/*.sql
  (Supabase records the same version string in schema_migrations.)
#>
$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$migDir = Join-Path $repoRoot "supabase\migrations"
if (-not (Test-Path $migDir)) {
  Write-Error "Migrations directory not found: $migDir"
}
Get-ChildItem -LiteralPath $migDir -Filter "*.sql" | Sort-Object Name | ForEach-Object {
  if ($_.BaseName -match "^(\d{14})_") {
    $Matches[1]
  }
} | Sort-Object -Unique
