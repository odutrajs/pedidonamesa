#!/usr/bin/env bash
set -euo pipefail

API_BASE="https://developers.hostinger.com/api/vps/v1"
CORE_SERVICES=(pedidonamesa-api-1 pedidonamesa-web-1 pedidonamesa-nginx-1)
POLL_INTERVAL=10
MAX_WAIT=180
RESTART_FAIL_AFTER=90

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
  echo "$2" | jq -r --arg name "$name" '.[] | select(.name == $name) | .state'
}

elapsed=0
restarting_since=-1

while [ "$elapsed" -le "$MAX_WAIT" ]; do
  CONTAINERS=$(fetch_containers)

  echo "[$elapsed s] Container states:"
  echo "$CONTAINERS" | jq -r '.[] | "  \(.name): \(.state)"'

  api_state=$(container_state "pedidonamesa-api-1" "$CONTAINERS")
  if [ "$api_state" = "restarting" ]; then
    if [ "$restarting_since" -lt 0 ]; then
      restarting_since=$elapsed
    elif [ $((elapsed - restarting_since)) -ge "$RESTART_FAIL_AFTER" ]; then
      echo "API container is crash-looping for ${RESTART_FAIL_AFTER}s"
      echo "Recent API logs:"
      fetch_service_logs "api" | tail -20
      exit 1
    fi
  else
    restarting_since=-1
  fi

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
fetch_service_logs "api" | tail -20
exit 1
