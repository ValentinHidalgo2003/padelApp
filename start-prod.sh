#!/bin/bash

# =============================================================================
# PadelApp - Production Startup Script
# =============================================================================

set -e

echo "=========================================="
echo "  PadelApp - Production Deployment"
echo "=========================================="
echo ""

# Check .env file exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    echo "Copy .env.example to .env and configure your settings:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi

# Validate critical env vars
source .env
if [ "$SECRET_KEY" = "CHANGE_ME_generate_with_python_c_from_django_core_management_utils_import_get_random_secret_key_print_get_random_secret_key" ]; then
    echo "ERROR: You must change SECRET_KEY in .env!"
    exit 1
fi

if [ "$DB_PASSWORD" = "CHANGE_ME_strong_password_here" ]; then
    echo "ERROR: You must change DB_PASSWORD in .env!"
    exit 1
fi

echo "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

echo ""
echo "Building production images..."
docker-compose -f docker-compose.prod.yml build

echo ""
echo "Starting services..."
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "Waiting for database to be ready..."
sleep 5

echo ""
echo "Running migrations..."
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate --noinput

echo ""
echo "=========================================="
echo "  PadelApp is running!"
echo "  URL: http://localhost:${APP_PORT:-80}"
echo "=========================================="
echo ""
echo "Useful commands:"
echo "  Logs:      docker-compose -f docker-compose.prod.yml logs -f"
echo "  Stop:      docker-compose -f docker-compose.prod.yml down"
echo "  Restart:   docker-compose -f docker-compose.prod.yml restart"
echo "  Admin:     docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser"
