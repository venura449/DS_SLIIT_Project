Steps to Deploy the Healthcare Distributed System
==================================================

Prerequisites:
- Docker and Docker Compose installed
- Git installed
- Node.js v18+ (for local development only)
- Minimum 8GB RAM recommended

--------------------------------------------------
OPTION 1: Deploy with Docker Compose (Recommended)
--------------------------------------------------

1. Clone the repository:
   git clone https://github.com/venura449/DS_SLIIT_Project.git
   cd  DS_SLIIT_Project

2. Navigate to the infrastructure directory:
   cd infrastructure

3. Build and start all services:
   docker-compose up --build

4. Access the application:
   - Frontend:   http://localhost:80
   - API Gateway: http://localhost:3000

5. To stop all services:
   docker-compose down

6. To stop and remove all volumes (clean reset):
   docker-compose down -v

--------------------------------------------------
OPTION 2: Run Services Locally (Development)
--------------------------------------------------

1. Clone the repository:
   git clone https://github.com/venura449/DS_SLIIT_Project.git
   cd DS_SLIIT_Projectn     

2. Install and start each backend service (repeat for each):
   cd services/<service-name>
   npm install
   npm start

   Services to start:
   - auth-service         (port 3001)
   - patient-service      (port 3002)
   - doctor-service       (port 3003)
   - appointment-service  (port 3004)
   - telemedicine-service (port 3005)
   - payment-service      (port 3006)
   - notification-service (port 3007)
   - ai-symptom-service   (port 3008)

3. Start the API Gateway:
   cd gateway
   npm install
   npm start

4. Start the Frontend:
   cd frontend
   npm install
   npm run dev

5. Access the application at http://localhost:5173

--------------------------------------------------
Directory Structure
--------------------------------------------------
/frontend          - React frontend application
/gateway           - API Gateway (Express)
/services          - Individual microservices
/database          - Database init scripts
/infrastructure    - Docker Compose and Kubernetes configs
/model             - AI/ML model files
