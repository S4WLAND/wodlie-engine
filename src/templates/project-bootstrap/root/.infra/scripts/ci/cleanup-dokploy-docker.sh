#!/usr/bin/env bash
set -euo pipefail

if [ -z "${VPS_SSH_HOST:-}" ]; then
  echo "Missing VPS_SSH_HOST secret"
  exit 1
fi

if [ -z "${VPS_SSH_USER:-}" ]; then
  echo "Missing VPS_SSH_USER secret"
  exit 1
fi

if [ -z "${VPS_SSH_PRIVATE_KEY:-}" ]; then
  echo "Missing VPS_SSH_PRIVATE_KEY secret"
  exit 1
fi

ssh_port="${VPS_SSH_PORT:-22}"
cleanup_delay="${DOKPLOY_CLEANUP_DELAY_SECONDS:-180}"
prune_until="${DOKPLOY_DOCKER_PRUNE_UNTIL:-24h}"

if ! [[ "${cleanup_delay}" =~ ^[0-9]+$ ]]; then
  echo "DOKPLOY_CLEANUP_DELAY_SECONDS must be numeric"
  exit 1
fi

if [ "${cleanup_delay}" -gt 0 ]; then
  echo "Waiting ${cleanup_delay}s before Docker cleanup"
  sleep "${cleanup_delay}"
fi

if ! [[ "${prune_until}" =~ ^[0-9]+(s|m|h|d)$ ]]; then
  echo "DOKPLOY_DOCKER_PRUNE_UNTIL must use Docker duration format, for example 24h or 7d"
  exit 1
fi

ssh_dir="$(mktemp -d)"
private_key_path="${ssh_dir}/dokploy_cleanup_key"
known_hosts_path="${ssh_dir}/known_hosts"

cleanup() {
  rm -rf "${ssh_dir}"
}
trap cleanup EXIT

printf '%s\n' "${VPS_SSH_PRIVATE_KEY}" > "${private_key_path}"
chmod 600 "${private_key_path}"

ssh-keyscan -p "${ssh_port}" -H "${VPS_SSH_HOST}" > "${known_hosts_path}"

ssh \
  -i "${private_key_path}" \
  -p "${ssh_port}" \
  -o UserKnownHostsFile="${known_hosts_path}" \
  -o StrictHostKeyChecking=yes \
  "${VPS_SSH_USER}@${VPS_SSH_HOST}" \
  "DOKPLOY_DOCKER_PRUNE_UNTIL='${prune_until}' bash -s" <<'REMOTE_CLEANUP'
set -euo pipefail

echo "Docker usage before cleanup"
docker system df

docker system prune --all --force --filter "until=${DOKPLOY_DOCKER_PRUNE_UNTIL}"
docker builder prune --all --force --filter "until=${DOKPLOY_DOCKER_PRUNE_UNTIL}"

echo "Docker usage after cleanup"
docker system df
REMOTE_CLEANUP
