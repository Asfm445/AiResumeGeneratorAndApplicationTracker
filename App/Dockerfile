FROM python:3.9-slim

WORKDIR /app

# Install system dependencies for psycopg2 (if using non-binary or needing build tools)
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy everything into App directory to preserve package structure
COPY . /app/App

# Add /app to PYTHONPATH so "App" package is importable
ENV PYTHONPATH=/app

# Expose port
EXPOSE 8000

# Command to run the app
CMD ["uvicorn", "App.api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
