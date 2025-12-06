# PowerShell script to kill process using a specific port
param(
    [Parameter(Mandatory=$true)]
    [int]$Port
)

Write-Host "Checking for processes using port $Port..." -ForegroundColor Yellow

$listening = netstat -ano | Select-String ":$Port" | Select-String "LISTENING"

if ($listening) {
    $pids = @()
    foreach ($line in $listening) {
        $parts = $line.ToString().Trim() -split '\s+'
        $processId = $parts[-1]
        if ($processId -match '^\d+$') {
            if ($pids -notcontains $processId) {
                $pids += $processId
            }
        }
    }

    if ($pids.Count -gt 0) {
        foreach ($processId in $pids) {
            Write-Host "Killing process $processId using port $Port..." -ForegroundColor Red
            $result = taskkill /PID $processId /F 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[SUCCESS] Killed process $processId" -ForegroundColor Green
            } else {
                Write-Host "[FAILED] Could not kill process $processId" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "[INFO] No valid PIDs found" -ForegroundColor Yellow
    }
} else {
    Write-Host "[INFO] No processes found using port $Port" -ForegroundColor Green
}
