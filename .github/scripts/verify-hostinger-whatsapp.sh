#!/usr/bin/env bash
set -euo pipefail

API_BASE="https://developers.hostinger.com/api/vps/v1"
POLL_INTERVAL=10
MAX_WAIT=180

fetch_containers() {
  curl -sS \
    -H "Authorization: Bearer ${HOSTINGER_API_KEY}" \
    "${API_BASE}/virtual-machines/${HOSTINGER_VM_ID}/docker/${PROJECT_NAME}/containers"
}

fetch_service_logs() {
  curl -sS \
    -H "Authorization: Bearer ${HOSTINGER_API_KEY}" \
    "${API_BASE}/virtual-machines/${HOSTINGER_VM_ID}/docker/${PROJECT_NAME}/logs" \
    | jq -r --arg service "$1" '.[] | select(.service | test($service)) | .entries[-20:][] | .line' 2>/dev/null || true
}

container_state() {
  local name="$1"
  local json="$2"
  echo "$json" | jq -r --arg name "$name" '.[] | select(.name == $name) | .state'
}

elapsed=0

while [ "$elapsed" -le "$MAX_WAIT" ]; do
  CONTAINERS=$(fetch_containers)

  echo "[$elapsed s] WhatsApp container states:"
  echo "$CONTAINERS" | jq -r '.[] | "  \(.name): \(.state)"'

  STATE=$(echo "$CONTAINERS" | jq -r '.[] | select(.name | test("whatsapp-bot")) | .state' | head -1)

  case "$STATE" in
    running)
      echo "WhatsApp bot container is running"
      exit 0
      ;;
    restarting|starting|created)
      echo "Waiting for whatsapp-bot (state: ${STATE:-unknown})"
      ;;
    exited|dead)
      echo "WhatsApp bot container failed (state: ${STATE})"
      fetch_service_logs "whatsapp" | tail -20
      exit 1
      ;;
    "")
      echo "WhatsApp bot container not found yet"
      ;;
  esac

  if [ "$elapsed" -ge "$MAX_WAIT" ]; then
    break
  fi

  sleep "$POLL_INTERVAL"
  elapsed=$((elapsed + POLL_INTERVAL))
done

echo "Timed out waiting for WhatsApp bot after ${MAX_WAIT}s"
fetch_service_logs "whatsapp" | tail -20
exit 1
