# Stage 1: Build Shared Types and Client Frontend
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy root workspace configurations
COPY package.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/
COPY apps/client/package.json ./apps/client/

# Copy full source trees
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server
COPY apps/client ./apps/client

# Install dependencies across all workspaces
RUN bun install --backend=copyfile

# Build shared types and frontend Vite SPA
RUN bun --filter @rathena/shared build
RUN cd apps/client && bun run build

# Stage 2: Production Runtime
FROM oven/bun:1-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV CLIENT_DIST_PATH=/app/apps/client/dist

# Copy workspace files needed for server
COPY package.json tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server

# Copy built frontend assets
COPY --from=builder /app/apps/client/dist ./apps/client/dist

# Install production dependencies for server
RUN bun install --production --backend=copyfile

EXPOSE 3000

CMD ["bun", "apps/server/src/index.ts"]
