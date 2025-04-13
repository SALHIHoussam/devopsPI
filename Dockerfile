# Use official Node.js LTS image
FROM node:18-alpine as builder

# Create app directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy from builder stage
COPY --from=builder /app .

# Environment variables (defaults, can be overridden)
ENV DB_HOST=db
ENV DB_NAME=foodWasteDB
ENV PORT=5000

# Expose application port
EXPOSE 5000

# Command to run the application
CMD ["npm", "start"]
