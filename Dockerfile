# Use official Node.js LTS image (updated to 18.x)
FROM node:18-alpine as builder

# Create app directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Build the application (if needed)
# RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy from builder stage
COPY --from=builder /app .

# Expose application port
EXPOSE 5000

# Runtime environment variable for MongoDB
ENV MONGODB_URI=mongodb://mongo:27017/yourdb

# Command to run the application
CMD ["npm", "start"]
