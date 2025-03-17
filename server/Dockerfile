# Build stage
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
# Install ALL dependencies including dev dependencies needed for build
RUN npm ci

# Install TypeScript globally for build process
RUN npm install -g typescript

# Copy the source code and build directly with tsc instead of npm script
COPY . .
RUN npx tsc

# Production stage
FROM node:18-alpine

# Set node environment
ENV NODE_ENV=production
# Configure Node.js to use less memory
ENV NODE_OPTIONS="--max-old-space-size=512"

WORKDIR /usr/src/app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built app from build stage
COPY --from=builder /usr/src/app/dist ./dist

# Create uploads directory with proper permissions
RUN mkdir -p uploads && chown -R node:node ./uploads

# Use non-root user for better security
USER node

# Set healthcheck interval higher for Raspberry Pi to reduce resource usage
HEALTHCHECK --interval=60s --timeout=20s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-5000}/api/health || exit 1

# Expose the port your server uses
EXPOSE ${PORT:-5000}

# Start the server
CMD ["node", "dist/index.js"]
