@echo off
echo Copying assets from original santik project...
set SRC=%~dp0..\assets
set DST=%~dp0public\assets
if not exist "%DST%" mkdir "%DST%"
copy "%SRC%\statistik.json" "%DST%\" /Y
copy "%SRC%\bps.png"        "%DST%\" /Y
copy "%SRC%\logo.jpg"       "%DST%\" /Y
copy "%SRC%\logo_bps.png"   "%DST%\" /Y
copy "%SRC%\se.png"         "%DST%\" /Y
copy "%SRC%\SE2026.png"     "%DST%\" /Y
copy "%SRC%\bell.mp3"       "%DST%\" /Y
echo Done! Assets copied to public/assets/
pause
