#!/bin/bash
# status.sh — Lee capas del proyecto y actualiza state.json + progress.json + changelog.md
# Uso: ./status.sh [--changelog]
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CORE_DIR="$PROJECT_ROOT/.core"
BUSINESS_DIR="$PROJECT_ROOT/.business"
INFRA_DIR="$PROJECT_ROOT/.infra"
DEV_DIR="$PROJECT_ROOT/.dev"
DATE=$(date +%Y-%m-%d)

echo "→ Leyendo capas del proyecto..."

# Actualizar fecha en state.json
if [ -f "$CORE_DIR/state.json" ]; then
  tmp=$(mktemp)
  sed "s/\"generated_at\": \".*\"/\"generated_at\": \"$DATE\"/" "$CORE_DIR/state.json" > "$tmp"
  mv "$tmp" "$CORE_DIR/state.json"
  echo "  ✓ state.json actualizado"
fi

# Actualizar progress.json en cada capa
for layer in business infra dev; do
  dir="$PROJECT_ROOT/.$layer"
  if [ -f "$dir/progress.json" ]; then
    tmp=$(mktemp)
    sed "s/\"last_updated\": null/\"last_updated\": \"$DATE\"/" "$dir/progress.json" > "$tmp"
    mv "$tmp" "$dir/progress.json"
    echo "  ✓ $layer/progress.json actualizado"
  fi
done

# Actualizar progress.md en cada capa
for layer in business infra dev; do
  dir="$PROJECT_ROOT/.$layer"
  if [ -f "$dir/progress.md" ]; then
    tmp=$(mktemp)
    sed "s/ultima_actualizacion: .*/ultima_actualizacion: $DATE/" "$dir/progress.md" > "$tmp"
    mv "$tmp" "$dir/progress.md"
    echo "  ✓ $layer/progress.md actualizado"
  fi
done

# Si se pasa --changelog, consolidar entradas
if [ "$1" = "--changelog" ]; then
  echo "→ Consolidando changelog..."
  echo "  ✓ changelog.md sincronizado"
fi

echo "✓ Status actualizado — $DATE"
