#!/bin/bash

echo "=== Testing Composite Service ==="
echo ""

echo "1. Testing Composite Health Check (checks all services)"
curl -s http://localhost:8002/health | python3 -m json.tool
echo -e "\n"

echo "2. Testing Individual Service Health Checks through Composite"
echo "   - Integrations Service:"
curl -s http://localhost:8002/api/integrations/health | python3 -m json.tool | head -10
echo -e "\n   - Actions Service:"
curl -s http://localhost:8002/api/actions/health | python3 -m json.tool
echo -e "\n   - Classification Service:"
curl -s http://localhost:8002/api/classification/health | python3 -m json.tool | head -10
echo -e "\n"

echo "3. Testing Classification Service - List Sample Messages"
curl -s http://localhost:8002/api/classification/messages | python3 -m json.tool | head -30
echo -e "\n"

echo "4. Testing Classification Service - List Classifications"
curl -s http://localhost:8002/api/classification/classifications | python3 -m json.tool | head -20
echo -e "\n"

echo "5. Testing Actions Service - List Tasks (empty initially)"
curl -s "http://localhost:8002/api/actions/tasks?user_id=123" | python3 -m json.tool
echo -e "\n"

echo "6. Testing Integrations Service - List Connections (empty initially)"
curl -s http://localhost:8002/api/integrations/connections | python3 -m json.tool
echo -e "\n"

echo "=== Test Complete ==="

