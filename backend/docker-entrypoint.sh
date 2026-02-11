#!/bin/bash
# ==========================================
# Docker Entrypoint for PadelApp Backend
# ==========================================
# Este script se ejecuta antes de iniciar Gunicorn
# Aplica migraciones automáticamente en cada deploy

set -e

echo "🔍 Checking database connection..."
python << END
import sys
import psycopg2
import os
import time

max_retries = 30
retry_count = 0

while retry_count < max_retries:
    try:
        conn = psycopg2.connect(
            dbname=os.environ.get('DB_NAME'),
            user=os.environ.get('DB_USER'),
            password=os.environ.get('DB_PASSWORD'),
            host=os.environ.get('DB_HOST'),
            port=os.environ.get('DB_PORT')
        )
        conn.close()
        print("✅ Database connection successful!")
        sys.exit(0)
    except psycopg2.OperationalError:
        retry_count += 1
        print(f"⏳ Waiting for database... ({retry_count}/{max_retries})")
        time.sleep(2)

print("❌ Could not connect to database")
sys.exit(1)
END

echo "🗄️  Running database migrations..."
python manage.py migrate --noinput

echo "✅ Migrations completed successfully!"
echo "🚀 Starting Gunicorn..."

# Ejecutar Gunicorn con los argumentos proporcionados
exec "$@"
