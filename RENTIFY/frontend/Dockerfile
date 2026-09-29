FROM node:24-bookworm-slim AS build
WORKDIR /app/frontend
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json angular.json ./
COPY scripts ./scripts
COPY src ./src
COPY public ./public
RUN npm run build

FROM nginx:1.28-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist/rentify/browser /usr/share/nginx/html
EXPOSE 80
