FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
ARG BACKEND_RUNTIME_NODE_ENV
ARG BACKEND_RUNTIME_PORT
ENV NODE_ENV=${BACKEND_RUNTIME_NODE_ENV}
ENV PORT=${BACKEND_RUNTIME_PORT}
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE ${PORT}
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/health || exit 1
CMD ["node", "dist/server.js"]
