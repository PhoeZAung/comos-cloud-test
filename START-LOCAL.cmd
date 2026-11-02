@echo off
setlocal
cd /d "%~dp0"
set "PATH=%USERPROFILE%\.cosmos-dev\tools\node-v24.22.2-win-x64;%PATH%"
"%USERPROFILE%\.cosmos-dev\tools\node-v24.22.2-win-x64\node.exe" scripts\start-local.mjs
pause
