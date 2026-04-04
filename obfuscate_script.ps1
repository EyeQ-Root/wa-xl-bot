$ErrorActionPreference = "Stop"

$src = "c:\Users\abdo\Downloads\Telegram Desktop\xl-Boot"
$dest = "c:\Users\abdo\Downloads\Telegram Desktop\xl-Boot-obfuscated"

if (Test-Path $dest) {
    Remove-Item -Recurse -Force $dest
}
New-Item -ItemType Directory -Path $dest | Out-Null

Write-Host "Copying files to safe directory..."
Copy-Item "$src\faro.js" -Destination $dest
Copy-Item "$src\SS" -Destination $dest -Recurse
Copy-Item "$src\package.json" -Destination $dest
if (Test-Path "$src\package-lock.json") { Copy-Item "$src\package-lock.json" -Destination $dest }
Copy-Item "$src\TUTORIAL (IMPORTANT).txt" -Destination $dest

Write-Host "Starting hard obfuscation..."
Set-Location $dest

# Fixed command: removed --ignore-require-imports which caused an error.
npx -y javascript-obfuscator ./faro.js --output ./faro.js --compact true --control-flow-flattening true --control-flow-flattening-threshold 1 --dead-code-injection true --dead-code-injection-threshold 1 --identifier-names-generator hexadecimal --rename-globals true --string-array true --string-array-encoding 'rc4' --string-array-threshold 1 --transform-object-keys true --unicode-escape-sequence true --self-defending true
Write-Host "Obfuscating SS directory..."
npx -y javascript-obfuscator ./FaroModules --output ./FaroModules --compact true --control-flow-flattening true --control-flow-flattening-threshold 1 --dead-code-injection true --dead-code-injection-threshold 1 --identifier-names-generator hexadecimal --rename-globals true --string-array true --string-array-encoding 'rc4' --string-array-threshold 1 --transform-object-keys true --unicode-escape-sequence true --self-defending true

Write-Host "Done! Files are fully obfuscated."
