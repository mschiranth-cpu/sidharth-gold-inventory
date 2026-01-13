#!/bin/bash

#===============================================================================
# Alert Script - Send notifications via multiple channels
#
# Usage: ./scripts/alert.sh <severity> <title> <message>
# Example: ./scripts/alert.sh CRITICAL "Database Down" "Cannot connect to PostgreSQL"
#===============================================================================

SEVERITY=$1
TITLE=$2
MESSAGE=$3

# Configuration from environment
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL}"
EMAIL_TO="${ALERT_EMAIL:-admin@goldfactory.com}"
PAGERDUTY_KEY="${PAGERDUTY_SERVICE_KEY}"

# Colors for Slack
declare -A COLORS=(
  ["INFO"]="#36a64f"
  ["WARNING"]="#ffcc00"
  ["ERROR"]="#ff6600"
  ["CRITICAL"]="#ff0000"
)

# Timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
HOSTNAME=$(hostname)

#===============================================================================
# Slack Alert
#===============================================================================

send_slack() {
  if [ -z "$SLACK_WEBHOOK" ]; then
    return 0
  fi

  local color=${COLORS[$SEVERITY]:-"#808080"}
  
  curl -s -X POST "$SLACK_WEBHOOK" \
    -H 'Content-Type: application/json' \
    -d "{
      \"attachments\": [{
        \"color\": \"$color\",
        \"title\": \"[$SEVERITY] $TITLE\",
        \"text\": \"$MESSAGE\",
        \"fields\": [
          {\"title\": \"Host\", \"value\": \"$HOSTNAME\", \"short\": true},
          {\"title\": \"Time\", \"value\": \"$TIMESTAMP\", \"short\": true}
        ],
        \"footer\": \"Gold Factory Monitoring\"
      }]
    }" > /dev/null
    
  echo "Slack alert sent"
}

#===============================================================================
# Email Alert
#===============================================================================

send_email() {
  if [ -z "$EMAIL_TO" ] || ! command -v mail &> /dev/null; then
    return 0
  fi

  local subject="[$SEVERITY] Gold Factory Alert: $TITLE"
  local body="
Gold Factory Inventory System Alert
====================================

Severity: $SEVERITY
Title: $TITLE
Time: $TIMESTAMP
Host: $HOSTNAME

Message:
$MESSAGE

---
This is an automated alert from Gold Factory Monitoring.
"

  echo "$body" | mail -s "$subject" "$EMAIL_TO"
  echo "Email alert sent to $EMAIL_TO"
}

#===============================================================================
# PagerDuty Alert (for critical issues)
#===============================================================================

send_pagerduty() {
  if [ -z "$PAGERDUTY_KEY" ] || [ "$SEVERITY" != "CRITICAL" ]; then
    return 0
  fi

  curl -s -X POST "https://events.pagerduty.com/v2/enqueue" \
    -H 'Content-Type: application/json' \
    -d "{
      \"routing_key\": \"$PAGERDUTY_KEY\",
      \"event_action\": \"trigger\",
      \"payload\": {
        \"summary\": \"$TITLE: $MESSAGE\",
        \"source\": \"$HOSTNAME\",
        \"severity\": \"critical\",
        \"custom_details\": {
          \"title\": \"$TITLE\",
          \"message\": \"$MESSAGE\",
          \"timestamp\": \"$TIMESTAMP\"
        }
      }
    }" > /dev/null
    
  echo "PagerDuty alert sent"
}

#===============================================================================
# Log Alert
#===============================================================================

log_alert() {
  local log_file="${LOG_DIR:-/var/log/gold-factory}/alerts.log"
  mkdir -p "$(dirname "$log_file")"
  echo "[$TIMESTAMP] [$SEVERITY] $TITLE: $MESSAGE" >> "$log_file"
}

#===============================================================================
# Main
#===============================================================================

if [ -z "$SEVERITY" ] || [ -z "$TITLE" ]; then
  echo "Usage: $0 <severity> <title> <message>"
  echo "Severity: INFO, WARNING, ERROR, CRITICAL"
  exit 1
fi

echo "Sending $SEVERITY alert: $TITLE"

log_alert
send_slack
send_email
send_pagerduty

echo "Alert processing complete"
