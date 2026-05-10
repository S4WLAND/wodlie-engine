#!/bin/bash
# report.sh — Genera reporte .tex desde YYYY-WNN.md
# Uso: ./report.sh YYYY-WNN
set -e

if [ -z "$1" ]; then
  echo "Error: Especificar semana. Uso: ./report.sh YYYY-WNN"
  exit 1
fi

WEEK="$1"
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
INTERNAL_REPORT="$PROJECT_ROOT/.business/reports/internal/$WEEK.md"
CLIENT_REPORT_DIR="$PROJECT_ROOT/.business/reports/client"

if [ ! -f "$INTERNAL_REPORT" ]; then
  echo "Error: No se encontró $INTERNAL_REPORT"
  exit 1
fi

echo "→ Generando reporte cliente para $WEEK..."
echo "  Fuente: $INTERNAL_REPORT"
echo "  Destino: $CLIENT_REPORT_DIR/$WEEK.tex"

# El engine procesa el .md y genera el .tex
# Este script es invocado por wodlie report internamente
echo "  Ejecutar: wodlie report"
echo "✓ Listo — revisar $CLIENT_REPORT_DIR/$WEEK.tex antes de compilar"
