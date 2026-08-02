#!/bin/bash
if [ ! -f ./login_app ]; then
    ./build.sh
fi
echo "Starting C++ Desktop Application..."
./login_app
