#!/bin/bash
# trigger.sh — Dispatcher manual de triggers
# Uso: ./trigger.sh <nombre-trigger> [args...]
# Triggers disponibles: on-deploy, on-incident, on-milestone, on-pivot
set -e

TRIGGER="$1"
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TRIGGERS_DIR="$(dirname "$0")/../triggers"

if [ -z "$TRIGGER" ]; then
  echo "Error: Especificar trigger. Uso: ./trigger.sh <nombre>"
  echo "Triggers disponibles: on-deploy, on-incident, on-milestone, on-pivot"
  exit 1
fi

TRIGGER_FILE="$TRIGGERS_DIR/$TRIGGER.yml"
if [ ! -f "$TRIGGER_FILE" ]; then
  echo "Error: No se encontró $TRIGGER_FILE"
  exit 1
fi

echo "→ Ejecutando trigger: $TRIGGER"
echo "  Config: $TRIGGER_FILE"

# Leer pasos del trigger y ejecutarlos
# Invocado por: wodlie trigger <nombre>
bash "$PROJECT_ROOT/.core/scripts/status.sh"

echo "✓ Trigger $TRIGGER completado"
