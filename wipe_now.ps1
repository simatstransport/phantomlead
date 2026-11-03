Stop-Process -Name "SecurityUpdater","SafeExamBrowser","SEBClientService","SebWindowsService" -Force -ErrorAction SilentlyContinue

$paths = @(
    "C:\Program Files\SafeExamBrowser\Configuration",
    "C:\Program Files\SafeExamBrowser\Reset",
    "C:\Program Files\SafeExamBrowser\Service",
    "C:\Program Files\SafeExamBrowser\Application\Extensions",
    "C:\ProgramData\SafeExamBrowser",
    "$env:APPDATA\PhantomLead"
)

foreach ($p in $paths) {
    if (Test-Path $p) {
        Remove-Item -Path $p -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# Remove Startup Registry Key
Remove-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "AdminHealthMonitor" -ErrorAction SilentlyContinue
