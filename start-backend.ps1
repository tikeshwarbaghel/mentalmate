# Kill existing process on port 3001
$proc = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($proc) { Stop-Process -Id $proc.OwningProcess -Force }

cd "D:\DOWNLOADS\Downloads\Telegram Desktop\SEPM PROJECT\Mindful-Companion (1)\Mindful-Companion\artifacts\api-server"
node --enable-source-maps ./dist/index.mjs