#!/bin/bash

# Test Image Slider Integration
# This script tests all three components of the image slider feature

echo "🧪 Testing Image Slider Integration"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Backend Direct API
echo "Test 1: Backend Direct API (Android endpoint)"
echo "GET http://localhost:8000/api/slider/images"
echo "----------------------------------------------"

RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:8000/api/slider/images)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ SUCCESS${NC} - Status: $HTTP_CODE"
    echo "Response:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    IMAGE_COUNT=$(echo "$BODY" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null)
    echo -e "${GREEN}Found $IMAGE_COUNT slider images${NC}"
else
    echo -e "${RED}❌ FAILED${NC} - Status: $HTTP_CODE"
    echo "$BODY"
fi

echo ""
echo "Test 2: Backend Public API (Frontend endpoint)"
echo "GET http://localhost:8000/api/public/slider-images"
echo "---------------------------------------------------"

RESPONSE2=$(curl -s -w "\n%{http_code}" http://localhost:8000/api/public/slider-images)
HTTP_CODE2=$(echo "$RESPONSE2" | tail -n1)
BODY2=$(echo "$RESPONSE2" | sed '$d')

if [ "$HTTP_CODE2" = "200" ]; then
    echo -e "${GREEN}✅ SUCCESS${NC} - Status: $HTTP_CODE2"
    IMAGE_COUNT2=$(echo "$BODY2" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null)
    echo -e "${GREEN}Found $IMAGE_COUNT2 slider images${NC}"
else
    echo -e "${RED}❌ FAILED${NC} - Status: $HTTP_CODE2"
    echo "$BODY2"
fi

echo ""
echo "Test 3: Frontend Proxy (requires frontend running)"
echo "GET http://localhost:3000/api/backend/api/public/slider-images"
echo "----------------------------------------------------------------"

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    RESPONSE3=$(curl -s -w "\n%{http_code}" http://localhost:3000/api/backend/api/public/slider-images)
    HTTP_CODE3=$(echo "$RESPONSE3" | tail -n1)
    BODY3=$(echo "$RESPONSE3" | sed '$d')
    
    if [ "$HTTP_CODE3" = "200" ]; then
        echo -e "${GREEN}✅ SUCCESS${NC} - Status: $HTTP_CODE3"
        IMAGE_COUNT3=$(echo "$BODY3" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null)
        echo -e "${GREEN}Frontend proxy working! Found $IMAGE_COUNT3 images${NC}"
    else
        echo -e "${RED}❌ FAILED${NC} - Status: $HTTP_CODE3"
        echo "$BODY3"
    fi
else
    echo -e "${YELLOW}⚠️  SKIPPED${NC} - Frontend not running on port 3000"
    echo "   Start frontend with: cd frontend && npm run dev"
fi

echo ""
echo "Test 4: Check Android App Configuration"
echo "----------------------------------------"

ANDROID_API_FILE="/home/ankit/Documents/Code/vs/mobile-app/kotlin/app/src/main/java/com/vidyaschool/app/api/RetrofitClient.kt"

if [ -f "$ANDROID_API_FILE" ]; then
    BASE_URL=$(grep "BASE_URL" "$ANDROID_API_FILE" | head -1)
    echo "Current Android API configuration:"
    echo "   $BASE_URL"
    
    if echo "$BASE_URL" | grep -q "localhost\|127.0.0.1"; then
        echo -e "${YELLOW}⚠️  NOTE${NC}: Android app is pointing to localhost"
        echo "   For physical devices, change to your local IP address"
        echo "   Find IP with: ip addr show | grep 'inet '"
    elif echo "$BASE_URL" | grep -q "vidyaschool.vercel.app"; then
        echo -e "${GREEN}✅ OK${NC} - Pointing to production (vidyaschool.vercel.app)"
    else
        echo -e "${YELLOW}⚠️  Custom URL detected${NC}"
    fi
else
    echo -e "${RED}❌ RetrofitClient.kt not found${NC}"
fi

echo ""
echo "===================================="
echo "📊 Test Summary"
echo "===================================="
echo ""

if [ "$HTTP_CODE" = "200" ] && [ "$HTTP_CODE2" = "200" ]; then
    echo -e "${GREEN}✅ Backend API: WORKING${NC}"
    echo "   - Android endpoint: ✅"
    echo "   - Frontend endpoint: ✅"
    echo "   - Total images: $IMAGE_COUNT"
else
    echo -e "${RED}❌ Backend API: FAILED${NC}"
fi

if [ "$HTTP_CODE3" = "200" ]; then
    echo -e "${GREEN}✅ Frontend Proxy: WORKING${NC}"
elif curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${RED}❌ Frontend Proxy: FAILED${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend: NOT RUNNING${NC}"
fi

echo ""
echo "🎯 Next Steps:"
echo "   1. Keep backend running (http://localhost:8000)"
echo "   2. Start frontend: cd frontend && npm run dev"
echo "   3. Access admin panel: http://localhost:3000/admin/[username]/slider"
echo "   4. Build Android app: cd mobile-app/kotlin && ./gradlew assembleDebug"
echo "   5. Install APK on device and test!"
echo ""
