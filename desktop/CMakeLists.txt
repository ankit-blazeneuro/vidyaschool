cmake_minimum_required(VERSION 3.10)
project(desktop_login_app CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

if (WIN32)
    add_definitions(-D_WIN32_WINNT=0x0601)
endif()

find_package(PkgConfig REQUIRED)
pkg_check_modules(GTK3 REQUIRED gtk+-3.0)
pkg_check_modules(CURL REQUIRED libcurl)

include_directories(${GTK3_INCLUDE_DIRS} ${CURL_INCLUDE_DIRS})
link_directories(${GTK3_LIBRARY_DIRS} ${CURL_LIBRARY_DIRS})
add_definitions(${GTK3_CFLAGS_OTHER} ${CURL_CFLAGS_OTHER})

add_executable(login_app main.cpp)
target_link_libraries(login_app PRIVATE ${GTK3_LIBRARIES} ${CURL_LIBRARIES} pthread)

if (WIN32)
    target_link_libraries(login_app PRIVATE ws2_32 shell32)
endif()
