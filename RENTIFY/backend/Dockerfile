FROM node:24-bookworm-slim AS build
WORKDIR /app/backend
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:24-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app/backend
COPY --from=build --chown=node:node /app/backend/node_modules ./node_modules
COPY --from=build --chown=node:node /app/backend/dist ./dist
COPY --chown=node:node certs ./certs
COPY --chown=node:node package*.json ./
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
