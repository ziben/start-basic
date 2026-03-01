param(
  [string]$RepoPath = ".",
  [string]$Upstream = "https://github.com/ziben/start-basic",
  [string]$UpstreamBranch = "main",
  [string]$LocalBranch = "main"
)

$ErrorActionPreference = "Stop"

# ==========================================
# 同步上游更新脚本 (增强版)
# 支持：文件级保护、目录级保护、字段级保护、模式匹配
# ==========================================

# ------------------------------------------
# 保护配置
# ------------------------------------------

# 全文件保护：合并后完全恢复为本地版本
$ProtectedFiles = @(
  "ecosystem.config.cjs",
  "README.md",
  ".env",
  ".env.wx-test"
  # 按需添加
)

# 目录保护：整个目录不受上游影响（衍生项目专属目录）
# 支持通配符模式匹配
$ProtectedDirs = @(
  # 衍生项目自定义业务模块
  # "src/modules/business",
  # "src/modules/exam",
  # 衍生项目自定义 schema（编号 10+）
  # "db/prisma/schema/1*"
)

# Schema 保护模式：匹配这些 glob 的 .prisma.part 文件不会被上游覆盖
$ProtectedSchemaPattern = "1*.prisma.part"

# 路由保护：衍生项目新增的路由目录
$ProtectedRouteDirs = @(
  # "src/routes/_authenticated/exam",
  # "src/routes/api/exam"
)

# ------------------------------------------
# 辅助函数
# ------------------------------------------

function Test-GlobMatch {
  param([string]$Path, [string]$Pattern)
  return $Path -like $Pattern
}

function Backup-Path {
  param([string]$Source, [string]$BackupDir, [string]$Label)
  
  if (-not (Test-Path $Source)) { return $null }
  
  $safeName = $Source.Replace("/", "__").Replace("\", "__")
  
  if (Test-Path $Source -PathType Container) {
    $dest = Join-Path $BackupDir "dir__$safeName"
    Copy-Item $Source $dest -Recurse -Force
    Write-Host "  [Protect] Backed up dir: $Source" -ForegroundColor DarkGray
  }
  else {
    $dest = Join-Path $BackupDir "file__$safeName"
    Copy-Item $Source $dest -Force
    Write-Host "  [Protect] Backed up file: $Source" -ForegroundColor DarkGray
  }
  
  return @{ Source = $Source; Backup = $dest; IsDir = (Test-Path $Source -PathType Container) }
}

function Restore-Path {
  param($BackupInfo)
  
  if ($null -eq $BackupInfo) { return }
  
  $source = $BackupInfo.Source
  $backup = $BackupInfo.Backup
  $isDir = $BackupInfo.IsDir
  
  if ($isDir) {
    if (Test-Path $source) { Remove-Item $source -Recurse -Force }
    Copy-Item $backup $source -Recurse -Force
    git add $source 2>$null
    Write-Host "  [Restore] Restored dir: $source" -ForegroundColor Cyan
  }
  else {
    if (Test-Path $source) {
      $currentHash = (Get-FileHash $source).Hash
      $backupHash = (Get-FileHash $backup).Hash
      if ($currentHash -ne $backupHash) {
        Copy-Item $backup $source -Force
        git add $source 2>$null
        Write-Host "  [Restore] Restored file: $source" -ForegroundColor Cyan
      }
    }
    else {
      Copy-Item $backup $source -Force
      git add $source 2>$null
      Write-Host "  [Restore] Restored missing: $source" -ForegroundColor Cyan
    }
  }
}

# ------------------------------------------
# 主流程
# ------------------------------------------

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Sync Upstream (Enhanced)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Repo:     $RepoPath"
Write-Host "Upstream: $Upstream ($UpstreamBranch)"
Write-Host "Local:    $LocalBranch"
Write-Host ""

Set-Location $RepoPath

# --- Step 1: 检查工作区是否干净 ---
$status = git status --porcelain
if ($status) {
  Write-Host "[WARNING] Working tree is not clean!" -ForegroundColor Yellow
  Write-Host "Please commit or stash your changes first." -ForegroundColor Yellow
  Write-Host ""
  git status --short
  Write-Host ""
  $confirm = Read-Host "Continue anyway? (y/N)"
  if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Aborted." -ForegroundColor Red
    exit 1
  }
}

# --- Step 2: 专项保护 - 记录 package.json 中的项目名称 ---
if (Test-Path "package.json") {
  $currentPackage = Get-Content "package.json" -Raw | ConvertFrom-Json
  $localProjectName = $currentPackage.name
  Write-Host "[Protect] Local project name: $localProjectName" -ForegroundColor DarkGray
}

# --- Step 3: 创建临时备份目录 ---
$BackupDir = Join-Path $env:TEMP "zi-sync-backup-$(Get-Date -Format 'yyyyMMddHHmmss')"
New-Item -ItemType Directory -Path $BackupDir | Out-Null
$AllBackups = @()

Write-Host ""
Write-Host "--- Backing up protected items ---" -ForegroundColor Gray

# --- Step 4: 备份 - 全文件保护 ---
foreach ($file in $ProtectedFiles) {
  $backup = Backup-Path -Source $file -BackupDir $BackupDir -Label "file"
  if ($backup) { $AllBackups += $backup }
}

# --- Step 5: 备份 - 目录保护 ---
foreach ($dir in $ProtectedDirs) {
  # 支持 glob 模式
  if ($dir -match '[*?]') {
    $matched = Get-ChildItem -Path (Split-Path $dir) -Filter (Split-Path $dir -Leaf) -Directory -ErrorAction SilentlyContinue
    foreach ($m in $matched) {
      $relPath = $m.FullName.Replace((Get-Location).Path + "\", "").Replace("\", "/")
      $backup = Backup-Path -Source $relPath -BackupDir $BackupDir -Label "dir-glob"
      if ($backup) { $AllBackups += $backup }
    }
  }
  else {
    $backup = Backup-Path -Source $dir -BackupDir $BackupDir -Label "dir"
    if ($backup) { $AllBackups += $backup }
  }
}

# --- Step 6: 备份 - 路由保护 ---
foreach ($routeDir in $ProtectedRouteDirs) {
  $backup = Backup-Path -Source $routeDir -BackupDir $BackupDir -Label "route"
  if ($backup) { $AllBackups += $backup }
}

# --- Step 7: 备份 - Schema 保护（编号 10+ 的 .prisma.part 文件）---
$schemaDir = "db/prisma/schema"
if (Test-Path $schemaDir) {
  $customSchemas = Get-ChildItem -Path $schemaDir -Filter $ProtectedSchemaPattern -File -ErrorAction SilentlyContinue
  foreach ($schema in $customSchemas) {
    $relPath = "$schemaDir/$($schema.Name)"
    $backup = Backup-Path -Source $relPath -BackupDir $BackupDir -Label "schema"
    if ($backup) { $AllBackups += $backup }
  }
}

# --- Step 8: 确保 upstream remote 存在 ---
Write-Host ""
$remotes = git remote
if (-not ($remotes -contains "upstream")) {
  git remote add upstream $Upstream
  Write-Host "[Git] Added upstream remote: $Upstream" -ForegroundColor Green
}
else {
  # 确保 upstream URL 正确
  $currentUrl = git remote get-url upstream
  if ($currentUrl -ne $Upstream) {
    git remote set-url upstream $Upstream
    Write-Host "[Git] Updated upstream URL: $Upstream" -ForegroundColor Green
  }
}

# --- Step 9: Fetch 上游更新 ---
Write-Host "Fetching from upstream..." -ForegroundColor Gray
git fetch upstream

# --- Step 10: 切换到本地分支 ---
git checkout $LocalBranch

# --- Step 11: 显示更新摘要 ---
Write-Host ""
$behindCount = git rev-list --count "HEAD..upstream/$UpstreamBranch" 2>$null
if ($behindCount -eq "0") {
  Write-Host "[Info] Already up to date with upstream/$UpstreamBranch" -ForegroundColor Green
  # 仍然继续执行，因为可能需要恢复之前的保护项
}
else {
  Write-Host "[Info] $behindCount commit(s) behind upstream/$UpstreamBranch" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Recent upstream changes:" -ForegroundColor Gray
  git log --oneline "HEAD..upstream/$UpstreamBranch" -n 10
  Write-Host ""
}

# --- Step 12: 执行合并 ---
Write-Host "Merging upstream/$UpstreamBranch..." -ForegroundColor Gray
$mergeSuccess = $true
try {
  $mergeOutput = git merge "upstream/$UpstreamBranch" --no-edit 2>&1
  Write-Host $mergeOutput
}
catch {
  $mergeSuccess = $false
  Write-Host ""
  Write-Host "[WARNING] Merge encountered conflicts!" -ForegroundColor Yellow
  Write-Host "Protected items will still be restored." -ForegroundColor Yellow
}

# --- Step 13: 恢复专项保护 - package.json 中的名称 ---
if (Test-Path "package.json") {
  $mergedPackage = Get-Content "package.json" -Raw | ConvertFrom-Json
  if ($mergedPackage.name -ne $localProjectName) {
    Write-Host ""
    Write-Host "[Restore] Restoring project name to '$localProjectName'..." -ForegroundColor Cyan
    $mergedPackage.name = $localProjectName
    $jsonOutput = $mergedPackage | ConvertTo-Json -Depth 100
    [System.IO.File]::WriteAllText((Join-Path $PWD "package.json"), $jsonOutput)
    git add package.json
  }
}

# --- Step 14: 恢复所有备份项 ---
Write-Host ""
Write-Host "--- Restoring protected items ---" -ForegroundColor Gray
foreach ($backup in $AllBackups) {
  Restore-Path -BackupInfo $backup
}

# --- Step 15: 清理备份 ---
Remove-Item $BackupDir -Recurse -Force

# --- Step 16: 完成报告 ---
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Sync Complete" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

if (-not $mergeSuccess) {
  Write-Host "[Action Required] There are merge conflicts to resolve:" -ForegroundColor Yellow
  git diff --name-only --diff-filter=U
  Write-Host ""
  Write-Host "After resolving conflicts, run:" -ForegroundColor Yellow
  Write-Host "  git add ." -ForegroundColor White
  Write-Host "  git commit" -ForegroundColor White
}
else {
  Write-Host "Protected items:" -ForegroundColor Gray
  Write-Host "  Files:   $($ProtectedFiles.Count)" -ForegroundColor DarkGray
  Write-Host "  Dirs:    $($ProtectedDirs.Count)" -ForegroundColor DarkGray
  Write-Host "  Routes:  $($ProtectedRouteDirs.Count)" -ForegroundColor DarkGray
  Write-Host "  Schemas: $($customSchemas.Count) (pattern: $ProtectedSchemaPattern)" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "--------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "Tips:"
Write-Host "  1. If upstream updated '.env.example', check if you"
Write-Host "     need to add new keys to your '.env' file."
Write-Host "  2. Run 'pnpm db:gen' if schema files were updated."
Write-Host "  3. Run 'pnpm install' if dependencies changed."
Write-Host "--------------------------------------------------------" -ForegroundColor DarkGray