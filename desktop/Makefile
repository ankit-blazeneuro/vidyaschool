CXX = g++
CXXFLAGS = -std=c++17 -Wall `pkg-config --cflags gtk+-3.0 libcurl`
LIBS = `pkg-config --libs gtk+-3.0 libcurl` -lpthread
TARGET = login_app
SRC = main.cpp

all: $(TARGET)

$(TARGET): $(SRC)
	$(CXX) $(CXXFLAGS) $(SRC) -o $(TARGET) $(LIBS)

clean:
	rm -f $(TARGET)

.PHONY: all clean
