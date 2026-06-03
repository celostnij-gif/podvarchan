$path = "C:\buff\Podvarchan.com\.open-next"
$retries = 10
for ($i = 1; $i -le $retries; $i++) {
    Write-Host "Attempt $i..."
    try {
        # First try normal remove
        Remove-Item -LiteralPath $path -Recurse -Force -ErrorAction Stop
        Write-Host "REMOVED on attempt $i"
        exit 0
    } catch {
        Write-Host "  Failed: $($_.Exception.Message)"
        # Try to kill processes that might be locking files
        Get-Process | Where-Object { $_.ProcessName -match 'node|wrangler|open.next' } | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 3
    }
}
Write-Host "FAILED after $retries attempts"
exit 1
