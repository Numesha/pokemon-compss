param(
  [Parameter(Mandatory = $true)]
  [string]$InputPath,

  [string]$OutputPath = "public/master.json",
  [string]$AppVersion = "1.0.0",
  [string]$MasterVersion = "2026.07.06",
  [string]$MasterUpdatedAt = "2026-07-06T00:00:00+09:00",
  [switch]$ListTables,
  [switch]$NoStrict
)

$ErrorActionPreference = "Stop"

$requiredTables = @(
  "tblPokemon",
  "tblSpecialty",
  "tblType",
  "tblIngredient",
  "tblTypeBerry",
  "tblMainSkill",
  "tblSubSkill",
  "tblSleepType",
  "tblNature",
  "tblNatureEffect",
  "tblNatureEffectMap",
  "tblVariation",
  "tblIsland",
  "tblPokemonIsland",
  "tblIslandFavoriteType",
  "tblRecipe",
  "tblRecipeIngredient"
)

$tableNameAliases = @{
  "tblNatureEffectMap23" = "tblNatureEffectMap"
}

Add-Type -AssemblyName System.IO.Compression.FileSystem

function Normalize-PartPath {
  param([string]$BasePart, [string]$Target)
  if ($Target.StartsWith("/")) {
    return $Target.TrimStart("/")
  }

  $baseDir = [System.IO.Path]::GetDirectoryName($BasePart).Replace("\", "/")
  $combined = "$baseDir/$Target"
  $parts = New-Object System.Collections.Generic.List[string]

  foreach ($part in $combined.Split("/")) {
    if ($part -eq "" -or $part -eq ".") { continue }
    if ($part -eq "..") {
      if ($parts.Count -gt 0) {
        $parts.RemoveAt($parts.Count - 1)
      }
      continue
    }
    $parts.Add($part)
  }

  return [string]::Join("/", $parts)
}

function Get-EntryXml {
  param($Zip, [string]$Path)
  $entry = $Zip.GetEntry($Path)
  if ($null -eq $entry) {
    throw "Workbook part not found: $Path"
  }

  $stream = $entry.Open()
  try {
    $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
    try {
      [xml]$xml = $reader.ReadToEnd()
      return $xml
    }
    finally {
      $reader.Dispose()
    }
  }
  finally {
    $stream.Dispose()
  }
}

function Get-Relationships {
  param($Zip, [string]$Path)
  $entry = $Zip.GetEntry($Path)
  $rels = @{}
  if ($null -eq $entry) {
    return $rels
  }

  $xml = Get-EntryXml $Zip $Path
  foreach ($rel in $xml.Relationships.Relationship) {
    $rels[$rel.Id] = $rel.Target
  }
  return $rels
}

function Convert-ColToNumber {
  param([string]$Column)
  $value = 0
  foreach ($char in $Column.ToUpperInvariant().ToCharArray()) {
    $value = ($value * 26) + ([int][char]$char - [int][char]"A" + 1)
  }
  return $value
}

function Split-CellRef {
  param([string]$CellRef)
  if ($CellRef -notmatch "^([A-Z]+)([0-9]+)$") {
    throw "Invalid cell reference: $CellRef"
  }

  return @{
    Row = [int]$Matches[2]
    Col = Convert-ColToNumber $Matches[1]
  }
}

function Split-RangeRef {
  param([string]$RangeRef)
  $parts = $RangeRef.Split(":")
  $start = Split-CellRef $parts[0]
  $end = Split-CellRef $parts[1]
  return @{
    StartRow = $start.Row
    StartCol = $start.Col
    EndRow = $end.Row
    EndCol = $end.Col
  }
}

function Convert-Scalar {
  param([string]$Value)
  $text = $Value.Trim()
  if ($text -eq "") { return "" }
  if ($text -eq "TRUE" -or $text -eq "true") { return $true }
  if ($text -eq "FALSE" -or $text -eq "false") { return $false }
  if ($text -match "^-?[0-9]+$") { return [int]$text }
  if ($text -match "^-?[0-9]+\.[0-9]+$") { return [double]$text }
  return $text
}

function Get-CellValue {
  param($Cell, [string[]]$SharedStrings)
  $cellType = $Cell.t

  if ($cellType -eq "inlineStr") {
    $texts = @()
    foreach ($textNode in $Cell.is.t) {
      $texts += [string]$textNode."#text"
    }
    return [string]::Join("", $texts)
  }

  if ($null -eq $Cell.v) {
    return ""
  }

  $raw = [string]$Cell.v
  if ($cellType -eq "s") {
    $index = [int]$raw
    if ($index -ge 0 -and $index -lt $SharedStrings.Count) {
      return $SharedStrings[$index]
    }
    return $raw
  }
  if ($cellType -eq "b") {
    return $raw -eq "1"
  }
  if ($cellType -eq "str") {
    return $raw
  }

  return Convert-Scalar $raw
}

function Get-SharedStrings {
  param($Zip)
  if ($null -eq $Zip.GetEntry("xl/sharedStrings.xml")) {
    return @()
  }

  $xml = Get-EntryXml $Zip "xl/sharedStrings.xml"
  $values = @()
  foreach ($si in $xml.sst.si) {
    $parts = @()
    if ($si.t) {
      $parts += [string]$si.t
    }
    if ($si.r) {
      foreach ($run in $si.r) {
        $parts += [string]$run.t
      }
    }
    $values += [string]::Join("", $parts)
  }
  return $values
}

function Get-Sheets {
  param($Zip)
  $workbookPath = "xl/workbook.xml"
  $workbook = Get-EntryXml $Zip $workbookPath
  $rels = Get-Relationships $Zip "xl/_rels/workbook.xml.rels"
  $sheets = @()

  foreach ($sheet in $workbook.workbook.sheets.sheet) {
    $relId = $sheet.id
    $target = $rels[$relId]
    if (-not $target) {
      throw "Missing relationship for sheet: $($sheet.name)"
    }
    $sheets += [pscustomobject]@{
      Name = $sheet.name
      Path = Normalize-PartPath $workbookPath $target
    }
  }

  return $sheets
}

function Get-TableRelPath {
  param([string]$SheetPath)
  $dir = [System.IO.Path]::GetDirectoryName($SheetPath).Replace("\", "/")
  $file = [System.IO.Path]::GetFileName($SheetPath)
  return "$dir/_rels/$file.rels"
}

function Get-Tables {
  param($Zip, $Sheets)
  $tables = @()

  foreach ($sheet in $Sheets) {
    $sheetXml = Get-EntryXml $Zip $sheet.Path
    $rels = Get-Relationships $Zip (Get-TableRelPath $sheet.Path)
    if ($null -eq $sheetXml.worksheet.tableParts) {
      continue
    }

    foreach ($tablePart in $sheetXml.worksheet.tableParts.tablePart) {
      $relId = $tablePart.id
      $target = $rels[$relId]
      if (-not $target) {
        continue
      }

      $tablePath = Normalize-PartPath $sheet.Path $target
      $tableXml = Get-EntryXml $Zip $tablePath
      $table = $tableXml.table
      $name = if ($table.name) { $table.name } else { $table.displayName }

      if ($name -and $table.ref) {
        $tables += [pscustomobject]@{
          Name = $name
          DisplayName = if ($table.displayName) { $table.displayName } else { $name }
          Ref = $table.ref
          SheetName = $sheet.Name
          SheetPath = $sheet.Path
          TablePath = $tablePath
        }
      }
    }
  }

  return $tables
}

function Get-SheetCells {
  param($Zip, [string]$SheetPath, [string[]]$SharedStrings)
  $xml = Get-EntryXml $Zip $SheetPath
  $cells = @{}

  foreach ($row in $xml.worksheet.sheetData.row) {
    foreach ($cell in $row.c) {
      if (-not $cell.r) {
        continue
      }

      $ref = Split-CellRef $cell.r
      $key = "$($ref.Row):$($ref.Col)"
      $cells[$key] = Get-CellValue $cell $SharedStrings
    }
  }

  return $cells
}

function Convert-TableToRows {
  param($Zip, $Table, [string[]]$SharedStrings, $SheetCache)
  if (-not $SheetCache.ContainsKey($Table.SheetPath)) {
    $SheetCache[$Table.SheetPath] = Get-SheetCells $Zip $Table.SheetPath $SharedStrings
  }

  $cells = $SheetCache[$Table.SheetPath]
  $range = Split-RangeRef $Table.Ref
  $headers = @()

  for ($col = $range.StartCol; $col -le $range.EndCol; $col++) {
    $key = "$($range.StartRow):$col"
    $header = [string]$cells[$key]
    if ([string]::IsNullOrWhiteSpace($header)) {
      $header = "column_$($col - $range.StartCol + 1)"
    }
    $headers += $header.Trim()
  }

  $rows = @()
  for ($rowIndex = $range.StartRow + 1; $rowIndex -le $range.EndRow; $rowIndex++) {
    $row = [ordered]@{}
    $hasValue = $false
    for ($col = $range.StartCol; $col -le $range.EndCol; $col++) {
      $offset = $col - $range.StartCol
      $key = "$rowIndex`:$col"
      $value = if ($cells.ContainsKey($key)) { $cells[$key] } else { "" }
      if ($value -ne "") {
        $hasValue = $true
      }
      $row[$headers[$offset]] = $value
    }
    if ($hasValue) {
      $rows += [pscustomobject]$row
    }
  }

  return $rows
}

function Build-MasterJson {
  param([string]$WorkbookPath)
  if (-not (Test-Path -LiteralPath $WorkbookPath)) {
    throw "Workbook not found: $WorkbookPath"
  }

  $zip = [System.IO.Compression.ZipFile]::OpenRead($WorkbookPath)
  try {
    $sharedStrings = Get-SharedStrings $zip
    $sheets = Get-Sheets $zip
    $tables = Get-Tables $zip $sheets

    $tableNames = @($tables | ForEach-Object {
      if ($tableNameAliases.ContainsKey($_.Name)) { $tableNameAliases[$_.Name] } else { $_.Name }
    })
    $missing = @($requiredTables | Where-Object { $_ -notin $tableNames })
    if ($missing.Count -gt 0 -and -not $NoStrict) {
      throw "Required Excel tables are missing: $($missing -join ', ')"
    }

    $sheetCache = @{}
    $tableRows = [ordered]@{}
    $tableSources = [ordered]@{}
    $tableOrder = @()

    foreach ($table in $tables) {
      $outputName = if ($tableNameAliases.ContainsKey($table.Name)) { $tableNameAliases[$table.Name] } else { $table.Name }
      $tableRows[$outputName] = @(Convert-TableToRows $zip $table $sharedStrings $sheetCache)
      $tableSources[$outputName] = [ordered]@{
        sheetName = $table.SheetName
        range = $table.Ref
        sourceTableName = $table.Name
      }
      $tableOrder += $outputName
    }

    return [ordered]@{
      meta = [ordered]@{
        schemaVersion = 1
        appVersion = $AppVersion
        masterVersion = $MasterVersion
        masterUpdatedAt = $MasterUpdatedAt
        generatedAt = (Get-Date).ToString("o")
        sourceWorkbook = [System.IO.Path]::GetFileName($WorkbookPath)
      }
      tables = $tableRows
      tableOrder = $tableOrder
      tableSources = $tableSources
    }
  }
  finally {
    $zip.Dispose()
  }
}

$resolvedInput = (Resolve-Path -LiteralPath $InputPath).Path

if ($ListTables) {
  $zip = [System.IO.Compression.ZipFile]::OpenRead($resolvedInput)
  try {
    $sheets = Get-Sheets $zip
    $tables = Get-Tables $zip $sheets
    foreach ($table in $tables) {
      Write-Output "$($table.Name)`t$($table.SheetName)`t$($table.Ref)"
    }
  }
  finally {
    $zip.Dispose()
  }
  exit 0
}

$master = Build-MasterJson $resolvedInput
$outPath = Join-Path (Get-Location) $OutputPath
$outDir = Split-Path -Parent $outPath
if (-not (Test-Path -LiteralPath $outDir)) {
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

$json = $master | ConvertTo-Json -Depth 20
[System.IO.File]::WriteAllText($outPath, $json + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))

Write-Output "Wrote $OutputPath"
Write-Output "Tables: $($master.tableOrder.Count)"
