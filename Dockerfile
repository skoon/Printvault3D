# ---- Build stage: produce the static web bundle ----
FROM node:20-slim AS build
WORKDIR /app

# Install all deps (build needs dev deps like vite). A clean install inside
# this Linux image sidesteps the host-platform npm optional-dependency issues.
COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run web:build

# ---- Runtime stage: serve via the Express server ----
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PVAULT_PORT=8787
ENV PVAULT_DATA_DIR=/data

# Only the production deps are needed to run the server.
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Bring in the built site, the server, and the shared scan module.
COPY --from=build /app/dist ./dist
COPY server ./server
COPY shared ./shared

VOLUME ["/data"]
EXPOSE 8787
CMD ["node", "server/index.mjs"]
