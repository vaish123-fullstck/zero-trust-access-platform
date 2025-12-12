# frontend/Dockerfile

# 1. Build stage
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci

COPY . .
RUN npm run build

# 2. Nginx static server
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Default nginx listens on 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
