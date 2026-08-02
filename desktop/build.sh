#!/bin/bash
set -e
echo "Building C++ VidyaSchool Device Auth Application..."
g++ -std=c++17 main.cpp -o login_app $(pkg-config --cflags --libs gtk+-3.0 libcurl) -lpthread
echo "Build successful! Executable created: ./login_app"
