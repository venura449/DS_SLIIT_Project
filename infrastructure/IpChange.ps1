
# Start minikube
minikube start

# Get current host IP
$HOST_IP = (minikube ssh "ip route | grep default" | Select-String -Pattern '\d+\.\d+\.\d+\.\d+').Matches[0].Value
Write-Host "Host IP: $HOST_IP"

# Update Kafka broker env var in K8s
minikube docker-env | Invoke-Expression
kubectl set env deployment/auth-service KAFKA_BROKER="${HOST_IP}:9092" -n healthcare
kubectl set env deployment/payment-service KAFKA_BROKER="${HOST_IP}:9092" -n healthcare
kubectl set env deployment/notification-service KAFKA_BROKER="${HOST_IP}:9092" -n healthcare

# Update hosts file (run as admin)
$hostsFile = "C:\Windows\System32\drivers\etc\hosts"
$minikubeIP = minikube ip
(Get-Content $hostsFile) -replace '.*healthcare\.local', "$minikubeIP  healthcare.local" | Set-Content $hostsFile

Write-Host "Done! Access at http://healthcare.local"
Write-Host "Minikube IP: $minikubeIP"