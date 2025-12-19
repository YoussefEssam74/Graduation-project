FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pytorch (CPU usually for Docker unless nvidia container toolkit used)
# Use specific index for CPU to save space if GPU not strictly needed for build
RUN pip install torch --index-url https://download.pytorch.org/whl/cpu

COPY app.py .

CMD ["python", "app.py"]
