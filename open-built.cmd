@echo off
setlocal
cd /d "%~dp0"
if not exist node_modules (
  call npm.cmd install
)
call npm.cmd run build || exit /b 1

set "PORT=4173"
set "URL=http://localhost:%PORT%/"

powershell -NoProfile -Command "$client = New-Object Net.Sockets.TcpClient; try { $client.Connect('127.0.0.1', %PORT%); exit 0 } catch { exit 1 } finally { $client.Close() }"
if %errorlevel%==0 (
  echo.
  echo Preview server is already running at %URL%
  start "" "%URL%"
  exit /b 0
)

echo.
echo Starting preview server at %URL%
start "Campus AI Preview" /min npm.cmd run preview -- --port %PORT% --strictPort

powershell -NoProfile -Command "$deadline = (Get-Date).AddSeconds(15); do { try { $response = Invoke-WebRequest -UseBasicParsing -Uri '%URL%' -TimeoutSec 1; if ($response.StatusCode -lt 500) { exit 0 } } catch { }; Start-Sleep -Milliseconds 300 } while ((Get-Date) -lt $deadline); exit 1"
if errorlevel 1 (
  echo Failed to start preview server at %URL%
  exit /b 1
)

start "" "%URL%"
