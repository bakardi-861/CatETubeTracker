#!/bin/bash

# CatETube Tracker API Testing Script
# Make sure backend server is running on localhost:5000

BASE_URL="http://localhost:5000"
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 CatETube Tracker API Testing${NC}"
echo "=================================="

# Function to test API endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "\n${YELLOW}Testing: $description${NC}"
    echo "→ $method $BASE_URL$endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✅ Success ($http_code)${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ Failed ($http_code)${NC}"
        echo "$body"
    fi
}

# Test basic connection
test_endpoint "GET" "/" "" "Basic connection test"

# Test tracker endpoints
test_endpoint "GET" "/api/tracker/today" "" "Get today's tracker"

test_endpoint "POST" "/api/tracker/today" '{"daily_target_ml": 210}' "Set daily target to 210mL"

# Test feeding functionality
test_endpoint "POST" "/api/feeding/" '{"amount_ml": 70, "flushed_before": true, "flushed_after": true}' "Log 70mL feeding"

test_endpoint "GET" "/api/feeding/" "" "Get feeding history"

# Test medication functionality  
test_endpoint "POST" "/api/medication_log/" '{"amount_ml": 5, "flushed_before": true, "flushed_after": true}' "Log 5mL medication"

test_endpoint "GET" "/api/medication_log/" "" "Get medication history"

# Test tracker after feeding
test_endpoint "GET" "/api/tracker/today" "" "Check tracker after feeding"

# Test multiple feedings to reach daily goal
echo -e "\n${BLUE}🔄 Testing Multiple Feedings (Daily Goal Completion)${NC}"
for i in {1..2}; do
    test_endpoint "POST" "/api/feeding/" '{"amount_ml": 70, "flushed_before": true, "flushed_after": true}' "Additional 70mL feeding ($i)"
done

# Check final tracker status
test_endpoint "GET" "/api/tracker/today" "" "Final tracker status"

# Test tracker stats
test_endpoint "GET" "/api/tracker/stats" "" "Get tracker statistics"

# Test tracker history
test_endpoint "GET" "/api/tracker/history?days=7" "" "Get 7-day tracker history"

# Test report generation
echo -e "\n${BLUE}📊 Testing Report Generation${NC}"
echo "Generating feeding report..."

# Generate report and capture report ID
report_response=$(curl -s -X POST "$BASE_URL/api/report/feeding" \
    -H "Content-Type: application/json" \
    -d '{"format": "json"}')

report_id=$(echo "$report_response" | jq -r '.report_id' 2>/dev/null)

if [ "$report_id" != "null" ] && [ "$report_id" != "" ]; then
    echo -e "${GREEN}✅ Report generation started: $report_id${NC}"
    
    # Check report status
    echo "Checking report status..."
    for i in {1..10}; do
        sleep 1
        status_response=$(curl -s "$BASE_URL/api/report/status/$report_id")
        status=$(echo "$status_response" | jq -r '.status' 2>/dev/null)
        
        echo "Status check $i: $status"
        
        if [ "$status" = "completed" ]; then
            echo -e "${GREEN}✅ Report completed successfully${NC}"
            break
        elif [ "$status" = "error" ]; then
            echo -e "${RED}❌ Report generation failed${NC}"
            break
        fi
    done
else
    echo -e "${RED}❌ Failed to start report generation${NC}"
fi

# Test manual reset
test_endpoint "POST" "/api/tracker/reset" '{"daily_target_ml": 210}' "Manual tracker reset"

echo -e "\n${BLUE}🏁 API Testing Complete${NC}"
echo "=================================="
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Test frontend at http://localhost:5173"
echo "2. Use browser dev tools to monitor API calls"
echo "3. Check backend console for logs"
echo "4. Test different scenarios (edge cases, errors, etc.)"

echo -e "\n${YELLOW}Quick Frontend Test:${NC}"
echo "Open browser and try:"
echo "• Log a 70mL feeding"
echo "• Check tracker progress"
echo "• Generate a report"
echo "• Change daily target in settings"