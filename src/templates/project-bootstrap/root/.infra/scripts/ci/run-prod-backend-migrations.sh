#!/usr/bin/env bash
set -euo pipefail

if [ -z "${PROD_BACKEND_MIGRATION_COMMAND:-}" ]; then
  echo "PROD_BACKEND_MIGRATION_COMMAND is empty; skipping production migrations"
  exit 0
fi

if [ -z "${VPS_SSH_HOST:-}" ] || [ -z "${VPS_SSH_USER:-}" ] || [ -z "${VPS_SSH_PRIVATE_KEY:-}" ]; then
  echo "Missing SSH secrets for production migrations"
  exit 1
fi

ssh_port="${VPS_SSH_PORT:-22}"
ssh_dir="$(mktemp -d)"
private_key_path="${ssh_dir}/prod_migration_key"
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
  "${PROD_BACKEND_MIGRATION_COMMAND}"
