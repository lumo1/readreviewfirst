# Stage 1: Dependency Installation
# This stage installs all dependencies, including devDependencies needed for the build.
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# Stage 2: Builder
# This stage builds your Next.js application. It copies dependencies from the 'deps' stage.
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# This command uses the .next/standalone output we configured.
RUN npm run build

# Stage 3: Runner - The final, small, production-ready image
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the line below if you want to enable hostname binding for some environments
# ENV HOSTNAME=0.0.0.0

# Copy the standalone output from the builder stage.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# The server is now located inside the standalone folder.
CMD ["node", "server.js"]