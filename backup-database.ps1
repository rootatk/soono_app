# Database Backup Script
# Save this as backup-database.ps1

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupPath = ".\database\backups"
$dbFile = ".\database\soono.db"
$backupFile = "$backupPath\soono_backup_$timestamp.db"

# Create backup directory if it doesn't exist
if (!(Test-Path $backupPath)) {
    New-Item -ItemType Directory -Path $backupPath
}

# Copy database file
Copy-Item $dbFile $backupFile

Write-Host "✅ Database backed up to: $backupFile" -ForegroundColor Green