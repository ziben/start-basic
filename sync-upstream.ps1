param(
  [string]$RepoPath = ".",
  [string]$Upstream = "https://github.com/ziben/start-basic",
  [string]$UpstreamBranch = "main",
  [string]$LocalBranch = "main"
)

$ErrorActionPreference = "Stop"

Write-Host ">> Sync upstream with name protection" -ForegroundColor Cyan
Write-Host "Repo: $RepoPath"
Write-Host "Upstream: $Upstream ($UpstreamBranch)"
Write-Host "Local: $LocalBranch"

# 0. 检查 ecosystem.config.cjs 状态
Write-Host "ecosystem.config.cjs is now tracked by git, we will protect your local copy during sync." -ForegroundColor DarkGray

Set-Location $RepoPath

# 1. 获取当前的 package.json 中的项目名称
if (Test-Path "package.json") {
    $currentPackage = Get-Content "package.json" -Raw | ConvertFrom-Json
    $localProjectName = $currentPackage.name
    Write-Host "Preserving local project name: $localProjectName" -ForegroundColor DarkGray
} else {
    Write-Error "package.json not found!"
    exit 1
}

# 2. 备份本地 ecosystem.config.cjs
$ecosystemBackupPath = [System.IO.Path]::GetTempFileName()
$hasEcosystem = Test-Path "ecosystem.config.cjs"
if ($hasEcosystem) {
    Copy-Item "ecosystem.config.cjs" $ecosystemBackupPath
    Write-Host "Backed up local ecosystem.config.cjs" -ForegroundColor DarkGray
}

# 3. 确保 remote 存在
if (-not (git remote | Select-String -Pattern "upstream")) {
  git remote add upstream $Upstream
  Write-Host "Added upstream remote" -ForegroundColor Green
}

Write-Host "Fetching from upstream..." -ForegroundColor Gray
git fetch upstream

# 3. 切换到本地分支
git checkout $LocalBranch

# 4. 执行合并
Write-Host "Merging upstream/$UpstreamBranch..." -ForegroundColor Gray
try {
    # 尝试合并
    $mergeOutput = git merge "upstream/$UpstreamBranch"
    Write-Host $mergeOutput
} catch {
    Write-Host "Merge encountered conflicts or failed." -ForegroundColor Yellow
}

# 5. 恢复并保护 package.json 中的名称
if (Test-Path "package.json") {
    $mergedPackageRaw = Get-Content "package.json" -Raw
    $mergedPackage = $mergedPackageRaw | ConvertFrom-Json
    
    if ($mergedPackage.name -ne $localProjectName) {
        Write-Host "Restoring project name to '$localProjectName'..." -ForegroundColor Cyan
        $mergedPackage.name = $localProjectName
        
        # 转换回 JSON 并保持格式 (PowerShell 的 ConvertTo-Json 在处理深度和字符编码时需要注意)
        # 使用 -Depth 100 确保复杂对象不被截断
        $jsonOutput = $mergedPackage | ConvertTo-Json -Depth 100
        
        # 简单的正则修复：ConvertTo-Json 可能会把某些字符转义，这里通过 Set-Content 保持 UTF8
        # 如果你发现缩进变了，可以使用更复杂的方案，但通常对于 package.json 够用了
        [System.IO.File]::WriteAllText((Join-Path $PWD "package.json"), $jsonOutput)
        
        Write-Host "package.json name restored." -ForegroundColor Green
        
        # 如果目前是合并中的状态或者是干净的状态，自动 commit
        if ((git status --porcelain | Select-String "package.json")) {
             git add package.json
             Write-Host "Auto-staged package.json changes." -ForegroundColor Gray
        }
    }
}

# 6. 恢复 ecosystem.config.cjs
if ($hasEcosystem) {
    if (Test-Path "ecosystem.config.cjs") {
        # 如果合并产生了新的文件，检查是否不同
        $currentHash = (Get-FileHash "ecosystem.config.cjs").Hash
        $backupHash = (Get-FileHash $ecosystemBackupPath).Hash
        
        if ($currentHash -ne $backupHash) {
            Write-Host "Restoring your local ecosystem.config.cjs..." -ForegroundColor Cyan
            Copy-Item $ecosystemBackupPath "ecosystem.config.cjs" -Force
            Write-Host "ecosystem.config.cjs restored." -ForegroundColor Green
        }
    } else {
        # 如果文件在合并中由于某种原因消失了，恢复它
        Write-Host "Restoring missing ecosystem.config.cjs..." -ForegroundColor Cyan
        Copy-Item $ecosystemBackupPath "ecosystem.config.cjs"
        Write-Host "ecosystem.config.cjs restored." -ForegroundColor Green
    }
}

# 清理备份
if (Test-Path $ecosystemBackupPath) { Remove-Item $ecosystemBackupPath }

Write-Host "`nDone." -ForegroundColor Green
Write-Host "If there are conflicts in other files, please resolve them manually." -ForegroundColor Yellow