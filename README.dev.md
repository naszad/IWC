# IWC Learning Platform - Development Environment

This guide explains how to set up and run the development environment for the IWC Learning Platform on your local machine.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- Git

## Getting Started

1. Clone the repository:
   ```
   git clone <repository-url>
   cd iwc-learning-platform
   ```

2. Create a `.env` file in the root directory with the following variables (customize as needed):
   ```
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
   ```

3. Start the development environment:
   ```
   docker-compose -f docker-compose.dev.yml up
   ```

   This will:
   - Start the client (React) on http://localhost:3000
   - Start the server (Node.js/Express) on http://localhost:5000
   - Start the PostgreSQL database on port 5432

## Development Features

- **Hot Reloading**: Both client and server support hot reloading, so changes to your code will be reflected immediately.
- **Volume Mounting**: Your local files are mounted into the containers, so you can edit code on your machine and see changes in real-time.
- **Database Persistence**: The development database data is stored in a Docker volume, so your data persists between container restarts.

## Useful Commands

- Start the development environment:
  ```
  docker-compose -f docker-compose.dev.yml up
  ```

- Start in detached mode (background):
  ```
  docker-compose -f docker-compose.dev.yml up -d
  ```

- View logs:
  ```
  docker-compose -f docker-compose.dev.yml logs -f
  ```

- Stop the environment:
  ```
  docker-compose -f docker-compose.dev.yml down
  ```

- Rebuild containers:
  ```
  docker-compose -f docker-compose.dev.yml up --build
  ```

- Reset the database:
  ```
  docker-compose -f docker-compose.dev.yml exec server npm run db:reset
  ```

## Troubleshooting

- **Port Conflicts**: If you have services running on the same ports (3000, 5000, 5432), change the ports in your `.env` file.
- **Database Connection Issues**: Make sure your server container can connect to the database container. The database host name should be `db`.
- **Volume Mounting Issues**: If you're on Windows, ensure Docker has permission to access your files.

## Project Structure

- `/client` - React frontend
- `/server` - Express backend
- `/nginx` - Nginx configuration (for production and development)