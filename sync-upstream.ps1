param(
  [string]$RepoPath = ".",
  [string]$Upstream = "https://github.com/ziben/start-basic",
  [string]$UpstreamBranch = "main",
  [string]$LocalBranch = "main"
)

$ErrorActionPreference = "Stop"

# ==========================================
# 保护名单配置 (全文件保护)
# 这些文件在合并后将完全恢复为本地版本
# ==========================================
$ProtectedFiles = @(
  "ecosystem.config.cjs",
  "README.md"
  # "public/favicon.ico" # 如果有需要也可以加在这里
)

Write-Host ">> Sync upstream with multi-layer protection" -ForegroundColor Cyan
Write-Host "Repo: $RepoPath"
Write-Host "Upstream: $Upstream ($UpstreamBranch)"
Write-Host "Local: $LocalBranch"

Set-Location $RepoPath

# 1. 专项保护：获取当前的 package.json 中的项目名称
# (因为 package.json 需要合并依赖，所以不能全文件保护，只能字段级保护)
if (Test-Path "package.json") {
  $currentPackage = Get-Content "package.json" -Raw | ConvertFrom-Json
  $localProjectName = $currentPackage.name
  Write-Host "[Protect] Local project name: $localProjectName" -ForegroundColor DarkGray
}

# 2. 全文件保护：备份名单中的文件
$BackupDir = Join-Path $env:TEMP "zi-sync-backup-$(Get-Date -Format 'yyyyMMddHHmmss')"
New-Item -ItemType Directory -Path $BackupDir | Out-Null
$Backups = @{}

foreach ($file in $ProtectedFiles) {
  if (Test-Path $file) {
    $dest = Join-Path $BackupDir $file.Replace("/", "_").Replace("\", "_")
    Copy-Item $file $dest
    $Backups[$file] = $dest
    Write-Host "[Protect] Backed up $file" -ForegroundColor DarkGray
  }
}

# 3. 确保 git remote 存在
if (-not (git remote | Select-String -Pattern "upstream")) {
  git remote add upstream $Upstream
  Write-Host "Added upstream remote: $Upstream" -ForegroundColor Green
}

Write-Host "Fetching from upstream..." -ForegroundColor Gray
git fetch upstream

# 4. 切换到本地分支
git checkout $LocalBranch

# 5. 执行合并
Write-Host "Merging upstream/$UpstreamBranch..." -ForegroundColor Gray
try {
  # 尝试合并
  $mergeOutput = git merge "upstream/$UpstreamBranch"
  Write-Host $mergeOutput
}
catch {
  Write-Host "Merge encountered conflicts or failed. Protection will still attempt to restore local files." -ForegroundColor Yellow
}

# 6. 恢复专项保护：恢复 package.json 中的名称
if (Test-Path "package.json") {
  $mergedPackage = Get-Content "package.json" -Raw | ConvertFrom-Json
  if ($mergedPackage.name -ne $localProjectName) {
    Write-Host "[Restore] Restoring project name to '$localProjectName'..." -ForegroundColor Cyan
    $mergedPackage.name = $localProjectName
    $jsonOutput = $mergedPackage | ConvertTo-Json -Depth 100
    [System.IO.File]::WriteAllText((Join-Path $PWD "package.json"), $jsonOutput)
    git add package.json
  }
}

# 7. 恢复全文件保护：恢复名单中的文件
foreach ($file in $Backups.Keys) {
  $backupPath = $Backups[$file]
  if (Test-Path $file) {
    $currentHash = (Get-FileHash $file).Hash
    $backupHash = (Get-FileHash $backupPath).Hash
    if ($currentHash -ne $backupHash) {
      Write-Host "[Restore] Restoring local version of $file..." -ForegroundColor Cyan
      Copy-Item $backupPath $file -Force
      git add $file
    }
  }
  else {
    Write-Host "[Restore] Restoring missing file $file..." -ForegroundColor Cyan
    Copy-Item $backupPath $file
    git add $file
  }
}

# 清理备份
Remove-Item $BackupDir -Recurse -Force

Write-Host "`nDone." -ForegroundColor Green
Write-Host "--------------------------------------------------------"
Write-Host "Pro Tip: If upstream updated '.env.example', please check"
Write-Host "if you need to add new keys to your local '.env' file."
Write-Host "--------------------------------------------------------" -ForegroundColor DarkGray