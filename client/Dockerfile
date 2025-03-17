# Build stage: build the React app
FROM node:16-alpine as builder

# Configure Node.js to use less memory during build
ENV NODE_OPTIONS="--max-old-space-size=1024"

WORKDIR /app

# Copy package files first to utilize Docker cache
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code and build
COPY . .
# Set production environment for build optimization
ENV NODE_ENV=production
# Set API URL for frontend to connect to the server
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
RUN npm run build && npm cache clean --force

# Production stage: serve the static files using Nginx with a smaller footprint
FROM nginx:alpine

# Optimize Nginx for low memory systems
COPY ./nginx/rpi-nginx.conf /etc/nginx/nginx.conf
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy the built app from the builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Set healthcheck interval higher for Raspberry Pi to reduce resource usage
HEALTHCHECK --interval=60s --timeout=20s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
