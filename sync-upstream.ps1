param(
  [string]$RepoPath = ".",
  [string]$Upstream = "https://github.com/ziben/start-basic",
  [string]$UpstreamBranch = "main",
  [string]$LocalBranch = "main"
)

$ErrorActionPreference = "Stop"

Write-Host ">> Sync upstream" -ForegroundColor Cyan
Write-Host "Repo: $RepoPath"
Write-Host "Upstream: $Upstream ($UpstreamBranch)"
Write-Host "Local: $LocalBranch"

Set-Location $RepoPath

# ensure remotes
if (-not (git remote | Select-String -Pattern "upstream")) {
  git remote add upstream $Upstream
  Write-Host "Added upstream remote" -ForegroundColor Green
}

git fetch upstream

# switch to local branch
git checkout $LocalBranch

# merge upstream
git merge "upstream/$UpstreamBranch"

Write-Host "Done." -ForegroundColor Green