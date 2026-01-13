#!/bin/bash

#===============================================================================
# Server Health Monitor
# Checks system health every minute and sends alerts if issues detected
#
# Usage: ./scripts/monitor.sh [--daemon]
# Add to crontab: * * * * * /path/to/scripts/monitor.sh
#===============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${LOG_DIR:-/var/log/gold-factory}/monitor.log"
ALERT_SCRIPT="$SCRIPT_DIR/alert.sh"

# Configuration
API_URL="${API_URL:-http://localhost:5000}"
HEALTH_ENDPOINT="$API_URL/api/health/detailed"
METRICS_ENDPOINT="$API_URL/api/health/metrics"

# Thresholds
CPU_THRESHOLD=80
MEMORY_THRESHOLD=85
DISK_THRESHOLD=90
RESPONSE_TIME_THRESHOLD=2000  # ms

# State file for tracking issues
STATE_FILE="/tmp/gold-factory-monitor-state"

#===============================================================================
# Logging
#===============================================================================

log() {
  local level=$1
  local message=$2
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $message" | tee -a "$LOG_FILE"
}

#===============================================================================
# Alert Function
#===============================================================================

send_alert() {
  local severity=$1
  local title=$2
  local message=$3
  
  log "$severity" "$title: $message"
  
  if [ -f "$ALERT_SCRIPT" ]; then
    "$ALERT_SCRIPT" "$severity" "$title" "$message"
  fi
}

#===============================================================================
# Health Checks
#===============================================================================

check_api_health() {
  log "INFO" "Checking API health..."
  
  local start_time=$(date +%s%3N)
  local response=$(curl -s -w "\n%{http_code}" --max-time 10 "$HEALTH_ENDPOINT" 2>/dev/null)
  local end_time=$(date +%s%3N)
  
  local status_code=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | sed '$d')
  local response_time=$((end_time - start_time))
  
  if [ "$status_code" != "200" ]; then
    send_alert "CRITICAL" "API Health Check Failed" "Status code: $status_code"
    return 1
  fi
  
  if [ "$response_time" -gt "$RESPONSE_TIME_THRESHOLD" ]; then
    send_alert "WARNING" "API Response Time High" "Response time: ${response_time}ms"
  fi
  
  # Check individual services from response
  if echo "$body" | grep -q '"status":"error"'; then
    local failed_service=$(echo "$body" | grep -o '"[^"]*":{"status":"error"' | head -1 | cut -d'"' -f2)
    send_alert "ERROR" "Service Degraded" "Service: $failed_service"
    return 1
  fi
  
  log "INFO" "API health OK (${response_time}ms)"
  return 0
}

check_database() {
  log "INFO" "Checking database..."
  
  local response=$(curl -s --max-time 10 "$API_URL/api/health/db" 2>/dev/null)
  
  if echo "$response" | grep -q '"status":"healthy"'; then
    local latency=$(echo "$response" | grep -o '"latency":"[^"]*"' | cut -d'"' -f4)
    log "INFO" "Database OK (latency: $latency)"
    return 0
  else
    send_alert "CRITICAL" "Database Connection Failed" "Database is not responding"
    return 1
  fi
}

check_redis() {
  log "INFO" "Checking Redis..."
  
  local response=$(curl -s --max-time 10 "$API_URL/api/health/redis" 2>/dev/null)
  
  if echo "$response" | grep -q '"status":"healthy"'; then
    log "INFO" "Redis OK"
    return 0
  else
    send_alert "ERROR" "Redis Connection Failed" "Redis is not responding"
    return 1
  fi
}

check_disk_space() {
  log "INFO" "Checking disk space..."
  
  local usage=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
  
  if [ "$usage" -gt "$DISK_THRESHOLD" ]; then
    send_alert "CRITICAL" "Disk Space Critical" "Usage: ${usage}%"
    return 1
  elif [ "$usage" -gt $((DISK_THRESHOLD - 10)) ]; then
    send_alert "WARNING" "Disk Space Warning" "Usage: ${usage}%"
  fi
  
  log "INFO" "Disk space OK (${usage}%)"
  return 0
}

check_memory() {
  log "INFO" "Checking memory..."
  
  local usage=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')
  
  if [ "$usage" -gt "$MEMORY_THRESHOLD" ]; then
    send_alert "ERROR" "Memory Usage High" "Usage: ${usage}%"
    return 1
  fi
  
  log "INFO" "Memory OK (${usage}%)"
  return 0
}

check_cpu() {
  log "INFO" "Checking CPU..."
  
  local usage=$(top -bn1 | grep "Cpu(s)" | awk '{print int($2)}')
  
  if [ "$usage" -gt "$CPU_THRESHOLD" ]; then
    send_alert "WARNING" "CPU Usage High" "Usage: ${usage}%"
    return 1
  fi
  
  log "INFO" "CPU OK (${usage}%)"
  return 0
}

check_docker_containers() {
  log "INFO" "Checking Docker containers..."
  
  if command -v docker &> /dev/null; then
    local unhealthy=$(docker ps --filter "health=unhealthy" --format "{{.Names}}" 2>/dev/null)
    
    if [ -n "$unhealthy" ]; then
      send_alert "ERROR" "Unhealthy Containers" "Containers: $unhealthy"
      return 1
    fi
    
    local exited=$(docker ps --filter "status=exited" --format "{{.Names}}" 2>/dev/null)
    if [ -n "$exited" ]; then
      send_alert "WARNING" "Stopped Containers" "Containers: $exited"
    fi
  fi
  
  log "INFO" "Docker containers OK"
  return 0
}

check_ssl_certificate() {
  log "INFO" "Checking SSL certificate..."
  
  local domain=$(echo "$API_URL" | sed -e 's|https://||' -e 's|/.*||')
  
  if [[ "$API_URL" == https://* ]]; then
    local expiry=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
    
    if [ -n "$expiry" ]; then
      local expiry_epoch=$(date -d "$expiry" +%s 2>/dev/null)
      local now_epoch=$(date +%s)
      local days_left=$(( (expiry_epoch - now_epoch) / 86400 ))
      
      if [ "$days_left" -lt 7 ]; then
        send_alert "CRITICAL" "SSL Certificate Expiring" "Expires in $days_left days"
        return 1
      elif [ "$days_left" -lt 30 ]; then
        send_alert "WARNING" "SSL Certificate Expiring Soon" "Expires in $days_left days"
      fi
      
      log "INFO" "SSL certificate OK ($days_left days remaining)"
    fi
  fi
  
  return 0
}

#===============================================================================
# Main Execution
#===============================================================================

main() {
  log "INFO" "=== Starting health check ==="
  
  local issues=0
  
  # Run all checks
  check_api_health || issues=$((issues + 1))
  check_database || issues=$((issues + 1))
  check_redis || issues=$((issues + 1))
  check_disk_space || issues=$((issues + 1))
  check_memory || issues=$((issues + 1))
  check_cpu || issues=$((issues + 1))
  check_docker_containers || issues=$((issues + 1))
  check_ssl_certificate || issues=$((issues + 1))
  
  # Summary
  if [ "$issues" -eq 0 ]; then
    log "INFO" "=== All checks passed ==="
    # Clear any previous alert state
    rm -f "$STATE_FILE"
  else
    log "ERROR" "=== $issues check(s) failed ==="
    echo "$issues" > "$STATE_FILE"
  fi
  
  return $issues
}

# Run as daemon if --daemon flag
if [ "$1" = "--daemon" ]; then
  while true; do
    main
    sleep 60
  done
else
  main
fi
