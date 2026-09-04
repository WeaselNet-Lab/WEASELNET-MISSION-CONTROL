# WeaselNet Knowledge Foundation

**Version:** 0.2  
**Generated:** 2026-07-14T22:09:38.012204+00:00

This is the corrected folder-ready Foundation package for the WeaselNet knowledge
archive. It contains the archive structure, inventories, hashes, duplicate
reconciliation, conversation indexes, and Alfred-readable source registries.

It intentionally does **not** contain the full raw asset payload yet.

## Install

Extract the contents of this ZIP into:

`OneDrive\WeaselNet-Knowledge`

Choose **Replace/Merge** when Windows asks about matching files. This package
supersedes Foundation v0.1 and replaces its inventory files with the completed
versions.

PowerShell alternative:

```powershell
Expand-Archive `
  -Path ".\WeaselNet-Knowledge-Foundation-v0.2.zip" `
  -DestinationPath "$env:OneDrive\WeaselNet-Knowledge" `
  -Force
```

## Reconciliation result

- Manifest asset paths: **653**
- Manifest asset paths represented: **653**
- Manifest asset paths unresolved: **0**
- Uploaded asset instances inventoried: **694**
- Distinct byte-level asset hashes: **617**
- Duplicate-content groups: **69**
- Conversations indexed: **624**
- Conversation-to-asset reference rows: **1,054**

The export manifest is now fully reconciled.

## Key files

- `60-Data/Inventory/asset-inventory.csv`
- `60-Data/Inventory/manifest-reconciliation.csv`
- `60-Data/Inventory/duplicate-report.csv`
- `60-Data/Inventory/conversation-inventory.csv`
- `60-Data/Inventory/conversation-asset-map.csv`
- `60-Data/Inventory/resolved-assets-verification.csv`
- `60-Data/Inventory/inventory-summary.json`
- `70-Alfred/knowledge-index.json`
- `70-Alfred/source-registry.jsonl`

## Privacy

`user.json` contains restricted account information. It is listed in the manifest
reconciliation, but its contents are not copied into this Foundation package.

## Next phase

The next package begins curating the highest-value material into VR troubleshooting,
system profiles, experiments, decisions, mission entries, and Alfred-ready knowledge.


## License

Code and scripts in this repository are licensed under the MIT License.

Documentation, mission entries, diagrams, and written materials are licensed under Creative Commons Attribution 4.0 International unless otherwise noted.