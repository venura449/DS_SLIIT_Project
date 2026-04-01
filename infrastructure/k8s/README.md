# Kubernetes Deployment Guide

## Overview

This directory contains all Kubernetes manifests to deploy the Healthcare platform to any Kubernetes cluster (Minikube, kind, EKS, GKE, AKS, etc.).

```
k8s/
├── 00-namespace.yaml          # healthcare namespace
├── 01-secrets.yaml            # DB credentials, JWT secret, SMS token
├── 02-configmap.yaml          # Service URLs, environment flags
├── databases/
│   ├── postgres-auth.yaml
│   ├── postgres-patient.yaml
│   ├── postgres-doctor.yaml
│   ├── postgres-appointment.yaml
│   ├── postgres-telemedicine.yaml
│   ├── postgres-payment.yaml
│   └── postgres-ai.yaml
├── messaging/
│   ├── zookeeper.yaml
│   └── kafka.yaml
├── services/
│   ├── auth-service.yaml
│   ├── patient-service.yaml
│   ├── doctor-service.yaml
│   ├── appointment-service.yaml
│   ├── telemedicine-service.yaml
│   ├── payment-service.yaml
│   ├── notification-service.yaml
│   ├── ml-service.yaml
│   ├── ai-symptom-service.yaml
│   ├── gateway.yaml
│   └── frontend.yaml
├── ingress/
│   └── ingress.yaml
└── monitoring/
    ├── prometheus.yaml
    └── grafana.yaml
```

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| kubectl | ≥ 1.28 | https://kubernetes.io/docs/tasks/tools/ |
| Docker | ≥ 24 | https://docs.docker.com/get-docker/ |
| Minikube (local) | ≥ 1.33 | https://minikube.sigs.k8s.io/docs/start/ |

---

## Step 1 — Build Docker Images

Each service must be built and pushed to a container registry before deploying.

### Option A — Local development with Minikube

```bash
# Start Minikube
minikube start --memory=8192 --cpus=4

# Point Docker to Minikube's daemon so images are built directly inside it
eval $(minikube docker-env)        # Linux/macOS
minikube docker-env | Invoke-Expression   # Windows PowerShell

# Build all images (run from project root)
docker build -t healthcare/frontend:latest        ./frontend
docker build -t healthcare/gateway:latest         ./gateway
docker build -t healthcare/auth-service:latest    ./services/auth-service
docker build -t healthcare/patient-service:latest ./services/patient-service
docker build -t healthcare/doctor-service:latest  ./services/doctor-service
docker build -t healthcare/appointment-service:latest ./services/appointment-service
docker build -t healthcare/telemedicine-service:latest ./services/telemedicine-service
docker build -t healthcare/payment-service:latest ./services/payment-service
docker build -t healthcare/notification-service:latest ./services/notification-service
docker build -t healthcare/ai-symptom-service:latest ./services/ai-symptom-service
docker build -t healthcare/ml-service:latest \
  -f services/ai-symptom-service/ml-integration/Dockerfile .
```

### Option B — Push to a remote registry (production)

Replace `your-registry` with your actual registry (e.g. `ghcr.io/your-org` or Docker Hub username):

```bash
REGISTRY=your-registry

docker build -t $REGISTRY/healthcare-frontend:latest ./frontend
docker push $REGISTRY/healthcare-frontend:latest
# ... repeat for each service
```

Then update the `image:` field in each YAML under `services/` to use `$REGISTRY/healthcare-<name>:latest`.

---

## Step 2 — Update Secrets (Production Only)

`01-secrets.yaml` uses placeholder values. **Before deploying to production**, replace them with real secrets using one of:

- **Sealed Secrets**: `kubeseal` to encrypt secrets committed to Git
- **External Secrets Operator**: pull from AWS Secrets Manager / Azure Key Vault / HashiCorp Vault
- **kubectl create secret**: create secrets imperatively (not stored in Git)

```bash
# Example: create DB credentials imperatively
kubectl create secret generic db-credentials \
  --namespace healthcare \
  --from-literal=username=admin \
  --from-literal=password=YOUR_STRONG_PASSWORD
```

---

## Step 3 — Enable Ingress Controller

### Minikube
```bash
minikube addons enable ingress
```

### Other clusters (NGINX Ingress Controller)
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/cloud/deploy.yaml
```

---

## Step 4 — Deploy Everything

Apply manifests in order (dependencies first):

```bash
# 1. Namespace, secrets, configmaps
kubectl apply -f infrastructure/k8s/00-namespace.yaml
kubectl apply -f infrastructure/k8s/01-secrets.yaml
kubectl apply -f infrastructure/k8s/02-configmap.yaml

# 2. Databases (StatefulSets)
kubectl apply -f infrastructure/k8s/databases/

# 3. Wait for databases to be ready
kubectl wait --for=condition=ready pod -l app=postgres-auth -n healthcare --timeout=120s

# 4. Messaging (Zookeeper → Kafka order matters)
kubectl apply -f infrastructure/k8s/messaging/zookeeper.yaml
kubectl wait --for=condition=ready pod -l app=zookeeper -n healthcare --timeout=120s
kubectl apply -f infrastructure/k8s/messaging/kafka.yaml
kubectl wait --for=condition=ready pod -l app=kafka -n healthcare --timeout=120s

# 5. Backend services
kubectl apply -f infrastructure/k8s/services/

# 6. Ingress
kubectl apply -f infrastructure/k8s/ingress/

# 7. Monitoring (optional)
kubectl apply -f infrastructure/k8s/monitoring/
```

Or apply everything at once (Kubernetes handles ordering via readiness probes):

```bash
kubectl apply -R -f infrastructure/k8s/
```

---

## Step 5 — Access the Application

### Minikube

```bash
# Get Minikube IP
minikube ip

# Add to hosts file (Windows: C:\Windows\System32\drivers\etc\hosts)
# <minikube-ip>  healthcare.local

# Or use port-forward for quick access
kubectl port-forward svc/frontend 8080:80 -n healthcare
kubectl port-forward svc/gateway 3000:3000 -n healthcare
```

### Grafana / Prometheus

```bash
kubectl port-forward svc/grafana 3000:3000 -n healthcare    # admin / admin123
kubectl port-forward svc/prometheus 9090:9090 -n healthcare
```

---

## Useful kubectl Commands

```bash
# Watch all pods
kubectl get pods -n healthcare -w

# Check logs
kubectl logs -f deployment/gateway -n healthcare
kubectl logs -f deployment/auth-service -n healthcare

# Describe a failing pod
kubectl describe pod <pod-name> -n healthcare

# Scale a service
kubectl scale deployment auth-service --replicas=3 -n healthcare

# Restart a deployment (e.g. after updating an image)
kubectl rollout restart deployment/gateway -n healthcare

# Check rollout status
kubectl rollout status deployment/gateway -n healthcare

# Delete everything in the namespace
kubectl delete namespace healthcare
```

---

## Horizontal Pod Autoscaler (HPA) — Optional

Enable the Metrics Server first (Minikube: `minikube addons enable metrics-server`), then:

```bash
kubectl autoscale deployment gateway \
  --namespace healthcare \
  --cpu-percent=70 \
  --min=2 --max=10

kubectl autoscale deployment auth-service \
  --namespace healthcare \
  --cpu-percent=70 \
  --min=2 --max=6
```

---

## Storage Notes

- PostgreSQL and Kafka use **StatefulSets** with `PersistentVolumeClaims`. Data survives pod restarts.
- Patient/doctor file uploads use a shared `ReadWriteMany` PVC — your cluster must support this storage class (e.g. NFS, EFS on AWS). For single-node Minikube, change `accessModes` to `ReadWriteOnce`.
- All storage sizes can be adjusted in the `volumeClaimTemplates` / `PersistentVolumeClaim` sections.
