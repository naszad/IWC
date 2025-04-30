### Multi-stage Dockerfile for Production Express Server

# 1. Build Stage: install dependencies
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package manifests
COPY package*.json ./

# Install ALL dependencies (including dev) for testing
RUN npm ci

# Copy application source with correct permissions
COPY --chown=node:node . .

# Switch to node user
USER node

# Run tests if needed
RUN if [ "$NODE_ENV" = "test" ]; then npm test; fi


# 2. Runtime Stage: lean production image
FROM node:18-alpine AS production

WORKDIR /usr/src/app

# Copy only dependencies and built code from builder with correct permissions
COPY --from=builder --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=node:node /usr/src/app .

# Switch to node user
USER node

# Set environment for production
ENV NODE_ENV=production

# Expose the port your Express app listens on (default: 5000)
EXPOSE 5000

# Start the server (adjust if your entrypoint differs)
CMD ["node", "bin/www"]