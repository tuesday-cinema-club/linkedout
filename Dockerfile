# LinkedIn Cybersecurity Bot - Docker Container
# Multi-stage build for optimized production image

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/dist ./dist

# Copy server and service files
COPY server.js ./
COPY services ./services

# Create directory for persistent config
RUN mkdir -p /app/config

# Expose ports
# 3000: Frontend (Vite preview)
# 4000: Backend proxy server
EXPOSE 3000 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start both servers
# In production, use a process manager like PM2 or separate containers
CMD ["sh", "-c", "node server.js & npx vite preview --host 0.0.0.0 --port 3000"]
