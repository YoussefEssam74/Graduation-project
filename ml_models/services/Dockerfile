FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose ports (will be overridden by compose)
EXPOSE 5300
EXPOSE 5301

# Default command - should be overridden by docker-compose
# This provides a helpful error if the image is run standalone
CMD ["python", "-c", "print('ERROR: This image requires docker-compose or explicit CMD override. Specify the service to run (e.g., python llm/llm_server.py)')"]
