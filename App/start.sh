#!/bin/sh
# Run database migrations
echo "Running database migrations..."
alembic upgrade head

# Start application server
echo "Starting application server..."
exec uvicorn App.api.main:app --host 0.0.0.0 --port 8000
