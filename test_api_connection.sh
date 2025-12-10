#!/bin/bash

# Test API Connection Script
# This script tests the connection to the backend API server

API_URL="http://35.239.94.117:8000"
HEALTH_ENDPOINT="${API_URL}/health"

echo "========================================="
echo "Testing API Connection"
echo "========================================="
echo ""
echo "Target: ${API_URL}"
echo "Health Endpoint: ${HEALTH_ENDPOINT}"
echo ""

# Test 1: Basic connectivity (ping-like test)
echo "1. Testing basic connectivity..."
if curl -s --max-time 5 --connect-timeout 5 "${HEALTH_ENDPOINT}" > /dev/null 2>&1; then
    echo "   ✅ Server is reachable"
else
    echo "   ❌ Server is NOT reachable"
    echo "   This could mean:"
    echo "   - The server is down"
    echo "   - Network connectivity issues"
    echo "   - Firewall blocking the connection"
    exit 1
fi

# Test 2: Health check endpoint
echo ""
echo "2. Testing health check endpoint..."
HEALTH_RESPONSE=$(curl -s --max-time 10 "${HEALTH_ENDPOINT}")

if [ $? -eq 0 ]; then
    echo "   ✅ Health check successful"
    echo ""
    echo "   Response:"
    echo "$HEALTH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    echo "   ❌ Health check failed"
    exit 1
fi

# Test 3: Response time
echo ""
echo "3. Measuring response time..."
START_TIME=$(date +%s%N)
curl -s --max-time 10 "${HEALTH_ENDPOINT}" > /dev/null
END_TIME=$(date +%s%N)
RESPONSE_TIME_MS=$(( (END_TIME - START_TIME) / 1000000 ))
echo "   Response time: ${RESPONSE_TIME_MS}ms"

# Test 4: Test other endpoints (if health check works)
echo ""
echo "4. Testing other endpoints..."
ENDPOINTS=("/api/integrations/connections" "/api/integrations/messages")
for endpoint in "${ENDPOINTS[@]}"; do
    FULL_URL="${API_URL}${endpoint}"
    echo -n "   Testing ${endpoint}... "
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${FULL_URL}")
    if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 500 ]; then
        echo "✅ (HTTP ${HTTP_CODE})"
    else
        echo "⚠️  (HTTP ${HTTP_CODE})"
    fi
done

echo ""
echo "========================================="
echo "Connection Test Complete"
echo "========================================="
