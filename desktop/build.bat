@echo off
echo Building C++ Login Application for Windows...
g++ -std=c++17 main.cpp -o login_app.exe %* -lws2_32 -lshell32 `pkg-config --cflags --libs gtk+-3.0`
if %ERRORLEVEL% EQU 0 (
    echo Build successful! Executable created: login_app.exe
) else (
    echo Build failed. Please ensure MinGW and GTK3 are installed.
)
