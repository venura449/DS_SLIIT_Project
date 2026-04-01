# Python ML Service Dockerfile
FROM python:3.11-slim

WORKDIR /app/ml-service

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better caching)
COPY services/ai-symptom-service/ml-integration/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy ML scripts and training data
COPY services/ai-symptom-service/ml-integration/symptom_analyzer.py .
COPY services/ai-symptom-service/ml-integration/train_model.py .
COPY model/Training.csv ./training_data/Training.csv

# Create models directory
RUN mkdir -p models

# Train model on startup
RUN python train_model.py || true

# Expose port
EXPOSE 5000

# Start the service
CMD ["python", "symptom_analyzer.py"]
