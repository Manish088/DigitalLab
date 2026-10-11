# ========================================================
# DIGITLAB FRONTEND - Angular 22 Production Container
# Multi-stage Dockerfile
# ========================================================

# Stage 1: Build Angular App
FROM node:20-alpine AS build
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
RUN npm ci

# Copy project files and build
COPY . .
RUN npm run build -- --configuration production

# Stage 2: Serve with Nginx
FROM nginx:alpine AS final
WORKDIR /usr/share/nginx/html

# Replace default Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled Angular distribution
COPY --from=build /app/dist/frontend/browser ./

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
