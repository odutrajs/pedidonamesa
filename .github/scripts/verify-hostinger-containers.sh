#!/usr/bin/env bash
set -euo pipefail

API_BASE="https://developers.hostinger.com/api/vps/v1"
CORE_SERVICES=(pedidonamesa-api-1 pedidonamesa-web-1 pedidonamesa-nginx-1)
POLL_INTERVAL=10
MAX_WAIT=300

fetch_containers() {
  curl -sS \
    -H "Authorization: Bearer ${HOSTINGER_API_KEY}" \
    "${API_BASE}/virtual-machines/${HOSTINGER_VM_ID}/docker/${PROJECT_NAME}/containers"
}

container_state() {
  local name="$1"
  echo "$2" | jq -r --arg name "$name" '.[] | select(.name == $name) | .state'
}

elapsed=0
while [ "$elapsed" -le "$MAX_WAIT" ]; do
  CONTAINERS=$(fetch_containers)

  echo "[$elapsed s] Container states:"
  echo "$CONTAINERS" | jq -r '.[] | "  \(.name): \(.state)"'

  all_running=true
  for service in "${CORE_SERVICES[@]}"; do
    STATE=$(container_state "$service" "$CONTAINERS")

    if [ -z "$STATE" ] || [ "$STATE" = "null" ]; then
      echo "Container $service not found yet"
      all_running=false
      continue
    fi

    case "$STATE" in
      running)
        ;;
      restarting|starting|created|removing)
        echo "Waiting for $service (state: $STATE)"
        all_running=false
        ;;
      *)
        echo "Container $service is in unexpected state: $STATE"
        exit 1
        ;;
    esac
  done

  if [ "$all_running" = true ]; then
    echo "Core containers are running"
    exit 0
  fi

  if [ "$elapsed" -ge "$MAX_WAIT" ]; then
    break
  fi

  sleep "$POLL_INTERVAL"
  elapsed=$((elapsed + POLL_INTERVAL))
done

echo "Timed out waiting for core containers after ${MAX_WAIT}s"
exit 1
