# C++ Desktop Browser Authentication Demo (Cross-Platform)

A modern, cross-platform desktop GUI application built in C++ that runs natively on **Windows** and **Linux** (and macOS).

## Cross-Platform Architecture
- **GUI Toolkit**: GTK+ 3.0 (supported on Windows, Linux, macOS).
- **Networking**: Winsock (`ws2_32`) on Windows and POSIX Sockets (`sys/socket.h`) on Linux/macOS via conditional compilation (`#ifdef _WIN32`).
- **Browser Launcher**: Native OS browser invocation (`ShellExecuteA` on Windows, `xdg-open` on Linux, `open` on macOS).

## How It Works
1. Launch app -> Click **"Login With Browser"**.
2. Opens your default web browser to `http://localhost:8080`.
3. Fill in **Name** and **Email** and submit.
4. The C++ background HTTP server intercepts `/callback` and dispatches the payload to GTK (`g_idle_add`).
5. Desktop UI smoothly transitions to display the user's name and email.

## How to Build & Run

### 🐧 Linux
```bash
# Quick build and run
./run.sh

# Or using Makefile / CMake
make
# or
mkdir build && cd build && cmake .. && make
```

### 🪟 Windows
1. **MinGW / GCC**:
   ```cmd
   build.bat
   login_app.exe
   ```
2. **CMake (Visual Studio / MSVC)**:
   ```cmd
   mkdir build
   cd build
   cmake ..
   cmake --build . --config Release
   ```
