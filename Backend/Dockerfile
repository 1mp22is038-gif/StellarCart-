# --- Build Stage ---
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies needed for Prisma
RUN apk add --no-cache openssl openssl-dev

# Copy package manifests first to leverage Docker layer caching
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# Generate Prisma Client specifically for the alpine target
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# --- Runtime Stage ---
FROM node:18-alpine

WORKDIR /app

# Install only the system dependencies required by Prisma at runtime
RUN apk add --no-cache openssl openssl-dev

# Copy necessary files from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma

# Expose backend API port
EXPOSE 5000

# Set environment explicitly
ENV NODE_ENV=production

# Run start script that points to src/index.js
CMD ["npm", "start"]
