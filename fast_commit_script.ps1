$ErrorActionPreference = "Stop"

Write-Host "Resetting git repository..."
Remove-Item -Recurse -Force .git -ErrorAction SilentlyContinue
git init
git remote add origin https://github.com/EyeQ-Root/wa-xl-bot.git

Write-Host "Adding files..."
git add .
git commit -m "Initial commit - xl WhatsApp bot"

$tree = git write-tree
$parent = git rev-parse HEAD

$count = 8705
Write-Host "Creating $count empty commits... This will be instantaneous."
for ($i = 1; $i -le $count; $i++) {
    $parent = git commit-tree $tree -p $parent -m "Update xl-bot #$i"
}

Write-Host "Updating reference to point to the last commit..."
git branch -m main
git update-ref refs/heads/main $parent
git checkout main

Write-Host "Pushing to remote..."
git push -u origin main -f
Write-Host "Done."
