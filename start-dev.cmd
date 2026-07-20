@echo off
cd /d "%~dp0"
if not exist node_modules (
  npm.cmd install
)
start "" "http://localhost:5173/"
npm.cmd run dev -- --port 5173
