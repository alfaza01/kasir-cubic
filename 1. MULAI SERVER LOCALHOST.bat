@echo off
color 0b
title SERVER CUBIC MULTI
echo ========================================================
echo MEMULAI SERVER LOKAL UNTUK APLIKASI CUBIC MULTI...
echo ========================================================
echo.
echo Aplikasi akan terbuka otomatis di browser Anda dalam beberapa detik.
echo Jangan tutup jendela hitam ini selama Anda menggunakan aplikasi.
echo.
timeout /t 3 >nul
start http://localhost:3020/
npm run dev
pause
