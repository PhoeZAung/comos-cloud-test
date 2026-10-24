@echo off
cd /d "%~dp0"
node scripts/build.mjs
if errorlevel 1 goto end
node server.mjs
:end
pause
