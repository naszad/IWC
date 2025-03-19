# IWC Learning Platform Development Environment Startup Script

Write-Host "DEBUG: Script started" -ForegroundColor Magenta

# Check if .env file exists, create it if it doesn't
if (-not (Test-Path .env)) {
    Write-Host "Creating default .env file..." -ForegroundColor Yellow
    $env_content = @"
# Development ports
CLIENT_PORT=3000
SERVER_PORT=5000
DB_PORT=5432

# Database configuration
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=iwc_language_db

# JWT configuration
JWT_SECRET=development_jwt_secret
JWT_EXPIRES_IN=24h

# API URL for frontend
REACT_APP_API_URL=http://localhost:5000
CORS_ORIGIN=http://localhost:3000
"@
    $env_content | Out-File -FilePath .env -Encoding utf8
    Write-Host ".env file created successfully." -ForegroundColor Green
} else {
    # Ensure the .env file contains required development values
    $envContent = Get-Content .env -Raw
    $modified = $false
    
    # Check REACT_APP_API_URL
    if (-not ($envContent -match 'REACT_APP_API_URL=http://localhost:5000')) {
        Write-Host "Fixing REACT_APP_API_URL in .env..." -ForegroundColor Yellow
        if ($envContent -match 'REACT_APP_API_URL=.+') {
            $envContent = $envContent -replace 'REACT_APP_API_URL=.+', 'REACT_APP_API_URL=http://localhost:5000'
        } else {
            $envContent += "`nREACT_APP_API_URL=http://localhost:5000"
        }
        $modified = $true
    }
    
    # Check CORS_ORIGIN
    if (-not ($envContent -match 'CORS_ORIGIN=http://localhost:3000')) {
        Write-Host "Fixing CORS_ORIGIN in .env..." -ForegroundColor Yellow
        if ($envContent -match 'CORS_ORIGIN=.+') {
            $envContent = $envContent -replace 'CORS_ORIGIN=.+', 'CORS_ORIGIN=http://localhost:3000'
        } else {
            $envContent += "`nCORS_ORIGIN=http://localhost:3000"
        }
        $modified = $true
    }
    
    # Save changes if needed
    if ($modified) {
        $envContent | Out-File -FilePath .env -Encoding utf8
        Write-Host ".env file updated with correct development settings." -ForegroundColor Green
    }
}

Write-Host "DEBUG: Checking Docker status" -ForegroundColor Magenta
try {
    $dockerJob = Start-Job -ScriptBlock { docker info }
    $completed = Wait-Job -Job $dockerJob -Timeout 10
    
    if ($completed -eq $null) {
        Write-Host "ERROR: Docker command timed out. Docker may be starting or unresponsive." -ForegroundColor Red
        Remove-Job -Job $dockerJob -Force
        exit 1
    }
    
    Receive-Job -Job $dockerJob | Out-Null
    Remove-Job -Job $dockerJob
    Write-Host "DEBUG: Docker is running" -ForegroundColor Magenta
} catch {
    Write-Host "ERROR: Docker is not running or not installed. Please start Docker Desktop first." -ForegroundColor Red
    Write-Host "Error details: $_" -ForegroundColor Red
    exit 1
}

Write-Host "DEBUG: Checking if nginx/dev.conf exists" -ForegroundColor Magenta
if (-not (Test-Path nginx/dev.conf)) {
    Write-Host "WARNING: nginx/dev.conf was not found. The container might fail to start." -ForegroundColor Yellow
}

Write-Host "Starting development environment..." -ForegroundColor Cyan
Write-Host "This will start the client, server, and database containers." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the containers." -ForegroundColor Cyan

Write-Host "DEBUG: Running docker-compose" -ForegroundColor Magenta
# Add the --build flag to ensure containers are rebuilt with the latest changes
docker-compose -f docker-compose.dev.yml up --build

Write-Host "DEBUG: After docker-compose command" -ForegroundColor Magenta
# This part only executes after the user stops the containers with Ctrl+C
Write-Host "Development environment stopped." -ForegroundColor Yellow