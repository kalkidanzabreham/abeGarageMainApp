# syntax=docker/dockerfile:1
# Web image. Stage 1 builds the static site; stage 2 serves it with nginx
# running as a non-root user (nginx-unprivileged listens on 8080).
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# retries + a BuildKit cache: slow or flaky registries shouldn't fail the
# build, and rebuilds reuse downloaded packages
RUN --mount=type=cache,target=/root/.npm \
    npm ci --fetch-retries=5 --fetch-retry-maxtimeout=120000 --fetch-timeout=300000
COPY . .
# Baked into the JS at build time. "/api" = same origin, proxied by nginx.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
