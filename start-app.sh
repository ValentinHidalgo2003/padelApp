#!/bin/bash

# Script para iniciar PadelApp con Docker y UI mejorada
echo "🎨 Iniciando PadelApp con UI mejorada usando Docker..."
echo ""

# Detener contenedores existentes
echo "Deteniendo contenedores existentes..."
docker-compose down

# Reconstruir e iniciar contenedores
echo ""
echo "🔨 Reconstruyendo contenedores con nuevas dependencias..."
echo ""
docker-compose up --build

echo ""
echo "✅ Aplicación iniciada!"
echo "Frontend: http://localhost:5174"
echo "Backend: http://localhost:8000"
