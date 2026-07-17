FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# VITE_API_URL will be injected at build time via --build-arg
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Serve the static files via nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Nginx config is mounted via compose or copied separately
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
