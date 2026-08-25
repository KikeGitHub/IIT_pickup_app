# ═══════════════════════════════════════════════════════════════════
#  STITCH PICKUP — Frontend Dockerfile (Multi-stage Build)
# ═══════════════════════════════════════════════════════════════════

# Stage 1: Build Angular Production Assets
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

# Stage 2: Serve via Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Clean default files
RUN rm -rf ./*

# Copy built Angular files
COPY --from=build /app/dist/stitch-pickup-fe/browser ./

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
