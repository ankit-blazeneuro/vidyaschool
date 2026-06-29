FROM mingc/android-build-box:latest

WORKDIR /app

COPY . .

RUN ./gradlew assembleDebug --no-daemon

CMD ["cp", "app/build/outputs/apk/debug/app-debug.apk", "/output/"]
