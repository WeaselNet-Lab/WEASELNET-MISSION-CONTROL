param(
    [Parameter(Mandatory=$true)]
    [string]$ExportFolder,

    [string]$MissingList = ".\60-Data\Inventory\missing-manifest-assets.txt"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $ExportFolder -PathType Container)) {
    throw "Export folder not found: $ExportFolder"
}

if (-not (Test-Path -LiteralPath $MissingList -PathType Leaf)) {
    throw "Missing asset list not found: $MissingList"
}

$missing = Get-Content -LiteralPath $MissingList |
    Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

$results = foreach ($relativeName in $missing) {
    $direct = Join-Path $ExportFolder $relativeName
    $found = Test-Path -LiteralPath $direct -PathType Leaf

    if (-not $found) {
        $base = [System.IO.Path]::GetFileNameWithoutExtension($relativeName)
        $extension = [System.IO.Path]::GetExtension($relativeName)
        $candidate = Get-ChildItem -LiteralPath $ExportFolder -File -Recurse |
            Where-Object {
                $_.BaseName -match ("^" + [regex]::Escape($base) + "(\(\d+\))?$") -and
                $_.Extension -eq $extension
            } |
            Select-Object -First 1

        if ($candidate) {
            $found = $true
            $direct = $candidate.FullName
        }
    }

    [pscustomobject]@{
        ExportPath = $relativeName
        Found = $found
        LocalPath = if ($found) { $direct } else { "" }
    }
}

$results | Format-Table -AutoSize

$notFound = @($results | Where-Object { -not $_.Found })
Write-Host ""
Write-Host ("Found: {0}" -f ($results.Count - $notFound.Count))
Write-Host ("Still missing: {0}" -f $notFound.Count)

if ($notFound.Count -gt 0) {
    $out = Join-Path (Get-Location) "missing-assets-still-not-found.csv"
    $notFound | Export-Csv -LiteralPath $out -NoTypeInformation -Encoding UTF8
    Write-Host "Saved unresolved list to: $out"
}
