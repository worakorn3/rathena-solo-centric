# Stage 1: Build Shared Types and Client Frontend
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy root workspace configurations & lockfile
COPY package.json bun.lock* tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/
COPY apps/client/package.json ./apps/client/

# Copy workspace source trees
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server
COPY apps/client ./apps/client

# Install dependencies with persistent BuildKit cache mount (instant resolution from cache)
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --backend=copyfile

# Build shared types and frontend Vite SPA
RUN bun run build

# Stage 2: Production Runtime
FROM oven/bun:1-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV CLIENT_DIST_PATH=/app/apps/client/dist

# Copy workspace configurations
COPY package.json tsconfig.base.json ./

# Copy complete node_modules and built packages from builder (preserves workspace links)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/server ./apps/server
COPY --from=builder /app/apps/client/dist ./apps/client/dist

EXPOSE 3000

CMD ["bun", "apps/server/src/index.ts"]
