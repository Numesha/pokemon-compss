# master.json generation

`ポケスリメインデータ.xlsx` is the official master data. The app reads only
`public/master.json`.

```text
Excel -> scripts/build-master-json.ps1 -> public/master.json -> app
```

The generated JSON keeps Excel table names such as `tblPokemon`,
`tblPokemonIsland`, and `tblRecipeIngredient`. User data is not included.
Tables that exist in the workbook are exported as-is. If the workbook uses a
merged table instead of a standalone table, the app should read the available
source table rather than inventing master data.

## Generate

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build-master-json.ps1 `
  -InputPath "C:\Users\kinoo\OneDrive\デスクトップ\ポケスリメインデータ.xlsx" `
  -OutputPath public/master.json `
  -AppVersion 1.0.0 `
  -MasterVersion 2026.07.06 `
  -MasterUpdatedAt 2026-07-06T00:00:00+09:00
```

## Inspect tables

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build-master-json.ps1 `
  -InputPath "C:\Users\kinoo\OneDrive\デスクトップ\ポケスリメインデータ.xlsx" `
  -ListTables
```

## Output shape

```json
{
  "meta": {
    "schemaVersion": 1,
    "appVersion": "1.0.0",
    "masterVersion": "2026.07.06",
    "masterUpdatedAt": "2026-07-06T00:00:00+09:00",
    "generatedAt": "...",
    "sourceWorkbook": "ポケスリメインデータ.xlsx"
  },
  "tables": {
    "tblPokemon": []
  },
  "tableOrder": ["tblPokemon"],
  "tableSources": {
    "tblPokemon": {
      "sheetName": "ポケモン",
      "range": "A1:M120"
    }
  }
}
```
