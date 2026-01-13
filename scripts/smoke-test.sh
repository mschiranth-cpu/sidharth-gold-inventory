#!/bin/bash

#===============================================================================
# Smoke Test Script - Gold Factory Inventory
# Tests critical user flows after deployment
#
# Usage: ./scripts/smoke-test.sh [environment]
# Example: ./scripts/smoke-test.sh production
#===============================================================================

set -e

# Configuration
ENVIRONMENT=${1:-staging}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Environment URLs
case $ENVIRONMENT in
  production)
    API_URL="${PROD_API_URL:-https://api.goldfactory.com}"
    FRONTEND_URL="${PROD_FRONTEND_URL:-https://goldfactory.com}"
    ;;
  staging)
    API_URL="${STAGING_API_URL:-https://staging-api.goldfactory.com}"
    FRONTEND_URL="${STAGING_FRONTEND_URL:-https://staging.goldfactory.com}"
    ;;
  *)
    API_URL="${API_URL:-http://localhost:5000}"
    FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"
    ;;
esac

# Test credentials (use environment variables)
TEST_EMAIL="${TEST_USER_EMAIL:-admin@goldfactory.com}"
TEST_PASSWORD="${TEST_USER_PASSWORD:-Admin123!}"

# Results
PASSED=0
FAILED=0
TESTS=()

#===============================================================================
# Utility Functions
#===============================================================================

log() {
  echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

pass() {
  echo -e "${GREEN}✓${NC} $1"
  PASSED=$((PASSED + 1))
  TESTS+=("PASS: $1")
}

fail() {
  echo -e "${RED}✗${NC} $1"
  FAILED=$((FAILED + 1))
  TESTS+=("FAIL: $1")
}

warn() {
  echo -e "${YELLOW}⚠${NC} $1"
}

section() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

# Make HTTP request and measure response time
http_request() {
  local method=$1
  local url=$2
  local data=$3
  local token=$4
  
  local headers="-H 'Content-Type: application/json'"
  if [ -n "$token" ]; then
    headers="$headers -H 'Authorization: Bearer $token'"
  fi
  
  local start_time=$(date +%s%3N)
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" $headers "$url" 2>/dev/null)
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" $headers -d "$data" "$url" 2>/dev/null)
  fi
  
  local end_time=$(date +%s%3N)
  local duration=$((end_time - start_time))
  
  # Split response body and status code
  local status_code=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | sed '$d')
  
  echo "$status_code|$duration|$body"
}

#===============================================================================
# Test Functions
#===============================================================================

test_health_check() {
  section "Health Check"
  
  local result=$(http_request "GET" "$API_URL/api/health")
  local status=$(echo "$result" | cut -d'|' -f1)
  local duration=$(echo "$result" | cut -d'|' -f2)
  
  if [ "$status" = "200" ]; then
    pass "API health check (${duration}ms)"
  else
    fail "API health check (status: $status)"
    return 1
  fi
  
  # Check response time
  if [ "$duration" -lt 100 ]; then
    pass "Response time acceptable (${duration}ms)"
  elif [ "$duration" -lt 500 ]; then
    warn "Response time slow (${duration}ms)"
    PASSED=$((PASSED + 1))
  else
    fail "Response time too slow (${duration}ms)"
  fi
}

test_frontend() {
  section "Frontend"
  
  local result=$(http_request "GET" "$FRONTEND_URL")
  local status=$(echo "$result" | cut -d'|' -f1)
  local body=$(echo "$result" | cut -d'|' -f3-)
  
  if [ "$status" = "200" ]; then
    pass "Frontend accessible"
    
    # Check for React app markers
    if echo "$body" | grep -q "root\|app\|script"; then
      pass "Frontend content loaded"
    else
      warn "Frontend may not be loading correctly"
    fi
  else
    fail "Frontend not accessible (status: $status)"
  fi
}

test_login() {
  section "Authentication"
  
  local login_data="{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}"
  local result=$(http_request "POST" "$API_URL/api/auth/login" "$login_data")
  local status=$(echo "$result" | cut -d'|' -f1)
  local body=$(echo "$result" | cut -d'|' -f3-)
  
  if [ "$status" = "200" ]; then
    pass "Login successful"
    
    # Extract token
    ACCESS_TOKEN=$(echo "$body" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$ACCESS_TOKEN" ]; then
      pass "Access token received"
      export ACCESS_TOKEN
    else
      fail "No access token in response"
    fi
  else
    fail "Login failed (status: $status)"
    return 1
  fi
}

test_get_orders() {
  section "Orders - Read"
  
  if [ -z "$ACCESS_TOKEN" ]; then
    fail "No access token - skipping"
    return 1
  fi
  
  local result=$(http_request "GET" "$API_URL/api/orders" "" "$ACCESS_TOKEN")
  local status=$(echo "$result" | cut -d'|' -f1)
  local duration=$(echo "$result" | cut -d'|' -f2)
  
  if [ "$status" = "200" ]; then
    pass "Get orders successful (${duration}ms)"
  else
    fail "Get orders failed (status: $status)"
  fi
}

test_create_order() {
  section "Orders - Create"
  
  if [ -z "$ACCESS_TOKEN" ]; then
    fail "No access token - skipping"
    return 1
  fi
  
  local timestamp=$(date +%s)
  local order_data=$(cat <<EOF
{
  "customerName": "Smoke Test Customer $timestamp",
  "product": "Test Gold Necklace 22K",
  "quantity": 1,
  "goldWeight": 10.5,
  "purity": "22K",
  "priority": "MEDIUM",
  "dueDate": "$(date -d '+7 days' '+%Y-%m-%d' 2>/dev/null || date -v+7d '+%Y-%m-%d')"
}
EOF
)
  
  local result=$(http_request "POST" "$API_URL/api/orders" "$order_data" "$ACCESS_TOKEN")
  local status=$(echo "$result" | cut -d'|' -f1)
  local body=$(echo "$result" | cut -d'|' -f3-)
  
  if [ "$status" = "201" ] || [ "$status" = "200" ]; then
    pass "Create order successful"
    
    # Extract order ID for later tests
    ORDER_ID=$(echo "$body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -z "$ORDER_ID" ]; then
      ORDER_ID=$(echo "$body" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    fi
    
    if [ -n "$ORDER_ID" ]; then
      pass "Order ID received: $ORDER_ID"
      export ORDER_ID
    fi
  else
    fail "Create order failed (status: $status)"
  fi
}

test_update_order() {
  section "Orders - Update"
  
  if [ -z "$ACCESS_TOKEN" ] || [ -z "$ORDER_ID" ]; then
    fail "Missing token or order ID - skipping"
    return 1
  fi
  
  local update_data='{"status":"IN_PROGRESS","notes":"Updated by smoke test"}'
  local result=$(http_request "PUT" "$API_URL/api/orders/$ORDER_ID" "$update_data" "$ACCESS_TOKEN")
  local status=$(echo "$result" | cut -d'|' -f1)
  
  if [ "$status" = "200" ]; then
    pass "Update order successful"
  else
    fail "Update order failed (status: $status)"
  fi
}

test_get_departments() {
  section "Departments"
  
  if [ -z "$ACCESS_TOKEN" ]; then
    fail "No access token - skipping"
    return 1
  fi
  
  local result=$(http_request "GET" "$API_URL/api/departments" "" "$ACCESS_TOKEN")
  local status=$(echo "$result" | cut -d'|' -f1)
  
  if [ "$status" = "200" ]; then
    pass "Get departments successful"
  else
    fail "Get departments failed (status: $status)"
  fi
}

test_get_users() {
  section "Users"
  
  if [ -z "$ACCESS_TOKEN" ]; then
    fail "No access token - skipping"
    return 1
  fi
  
  local result=$(http_request "GET" "$API_URL/api/users" "" "$ACCESS_TOKEN")
  local status=$(echo "$result" | cut -d'|' -f1)
  
  if [ "$status" = "200" ]; then
    pass "Get users successful"
  elif [ "$status" = "403" ]; then
    warn "Get users - insufficient permissions (expected for non-admin)"
    PASSED=$((PASSED + 1))
  else
    fail "Get users failed (status: $status)"
  fi
}

test_dashboard_stats() {
  section "Dashboard"
  
  if [ -z "$ACCESS_TOKEN" ]; then
    fail "No access token - skipping"
    return 1
  fi
  
  local result=$(http_request "GET" "$API_URL/api/dashboard/stats" "" "$ACCESS_TOKEN")
  local status=$(echo "$result" | cut -d'|' -f1)
  local duration=$(echo "$result" | cut -d'|' -f2)
  
  if [ "$status" = "200" ]; then
    pass "Dashboard stats successful (${duration}ms)"
  else
    # Try alternative endpoint
    result=$(http_request "GET" "$API_URL/api/orders/stats" "" "$ACCESS_TOKEN")
    status=$(echo "$result" | cut -d'|' -f1)
    if [ "$status" = "200" ]; then
      pass "Dashboard stats successful (alternative endpoint)"
    else
      warn "Dashboard stats endpoint not found"
    fi
  fi
}

test_reports() {
  section "Reports"
  
  if [ -z "$ACCESS_TOKEN" ]; then
    fail "No access token - skipping"
    return 1
  fi
  
  local result=$(http_request "GET" "$API_URL/api/reports/orders?startDate=2024-01-01&endDate=2024-12-31" "" "$ACCESS_TOKEN")
  local status=$(echo "$result" | cut -d'|' -f1)
  
  if [ "$status" = "200" ]; then
    pass "Reports generation successful"
  elif [ "$status" = "404" ]; then
    warn "Reports endpoint not found"
  else
    fail "Reports failed (status: $status)"
  fi
}

cleanup_test_data() {
  section "Cleanup"
  
  if [ -n "$ORDER_ID" ] && [ -n "$ACCESS_TOKEN" ]; then
    local result=$(http_request "DELETE" "$API_URL/api/orders/$ORDER_ID" "" "$ACCESS_TOKEN")
    local status=$(echo "$result" | cut -d'|' -f1)
    
    if [ "$status" = "200" ] || [ "$status" = "204" ]; then
      pass "Test order cleaned up"
    else
      warn "Could not delete test order (status: $status)"
    fi
  fi
}

#===============================================================================
# Main Execution
#===============================================================================

main() {
  echo ""
  echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║              SMOKE TEST - Gold Factory Inventory           ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo "Environment: $ENVIRONMENT"
  echo "API URL:     $API_URL"
  echo "Frontend:    $FRONTEND_URL"
  echo "Started:     $(date)"
  echo ""
  
  # Run tests
  test_health_check
  test_frontend
  test_login
  test_get_orders
  test_create_order
  test_update_order
  test_get_departments
  test_get_users
  test_dashboard_stats
  test_reports
  cleanup_test_data
  
  # Summary
  section "RESULTS"
  
  echo -e "${GREEN}Passed: $PASSED${NC}"
  echo -e "${RED}Failed: $FAILED${NC}"
  echo "────────────────────────"
  echo "Total:  $((PASSED + FAILED))"
  echo ""
  
  # Detailed results
  echo "Details:"
  for test in "${TESTS[@]}"; do
    if [[ $test == PASS* ]]; then
      echo -e "  ${GREEN}$test${NC}"
    else
      echo -e "  ${RED}$test${NC}"
    fi
  done
  
  echo ""
  echo "Completed: $(date)"
  echo ""
  
  # Exit code
  if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ SMOKE TEST FAILED${NC}"
    exit 1
  else
    echo -e "${GREEN}✅ SMOKE TEST PASSED${NC}"
    exit 0
  fi
}

# Run main function
main "$@"
