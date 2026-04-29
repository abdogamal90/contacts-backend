# Production Dockerfile - Multi-stage build for optimized image
FROM node:20-alpine AS builder

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install ALL dependencies for build
RUN npm ci

# Copy the rest of the application code
COPY . .

# Production stage
FROM node:20-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code from builder
COPY --from=builder /usr/src/app .

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /usr/src/app

# Switch to non-root user
USER nodejs

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]