### Multi-stage Dockerfile for Production Express Server

# 1. Build Stage: install dependencies
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package manifests and install dependencies (production only)
COPY package*.json ./
RUN npm ci --only=production

# Copy application source
COPY . .


# 2. Runtime Stage: lean production image
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy only dependencies and built code from builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app .

# Set environment for production
ENV NODE_ENV=production

# Expose the port your Express app listens on (default: 5000)
EXPOSE 5000

# Start the server (adjust if your entrypoint differs)
CMD ["node", "bin/www"]