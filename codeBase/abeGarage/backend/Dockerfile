# syntax=docker/dockerfile:1
# API image. Stage 1 installs production dependencies (build tools are only
# here, for bcrypt's native module); stage 2 copies them into a clean image
# that runs as the non-root "node" user.
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
# retries + a BuildKit cache: slow or flaky registries shouldn't fail the
# build, and rebuilds reuse downloaded packages
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --fetch-retries=5 --fetch-retry-maxtimeout=120000 --fetch-timeout=300000

FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .
USER node
EXPOSE 5000
# busybox wget is part of the alpine image. Uses $PORT because hosts such
# as Render set their own port; 5000 is the default (and compose's port).
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-5000}/api/health" > /dev/null || exit 1
CMD ["node", "app.js"]
