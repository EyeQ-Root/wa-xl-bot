$ErrorActionPreference = "Stop"

Write-Host "Adding files..."
git add .
try {
    git commit -m "Initial commit - xl WhatsApp bot"
} catch {
    Write-Host "Initial commit already exists or failed. Proceeding..."
}

$count = 8705
Write-Host "Creating $count empty commits... This will take a few minutes."
for ($i = 1; $i -le $count; $i++) {
    git commit --allow-empty -m "Update xl-bot #$i" | Out-Null
    if ($i % 1000 -eq 0) {
        Write-Host "Created $i commits..."
    }
}

Write-Host "Pushing to remote..."
git branch -M main
git push -u origin main -f
Write-Host "Done."
