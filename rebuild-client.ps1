# Rebuild and redeploy the client container
Write-Host "Stopping existing client container..." -ForegroundColor Cyan
docker-compose stop client

Write-Host "Rebuilding client container..." -ForegroundColor Cyan
docker-compose build client

Write-Host "Starting client container..." -ForegroundColor Cyan
docker-compose up -d client

Write-Host "Client container rebuilt and redeployed successfully!" -ForegroundColor Green 