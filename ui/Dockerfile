# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
COPY .npmrc ./
RUN npm install
COPY . .
RUN npm run build

# Production stage: Nginx + Node.js + Docker CLI
FROM nginx:stable-alpine
WORKDIR /app
COPY --from=build /app/build /usr/share/nginx/html
COPY --from=build /app/server.js ./
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY nginx.conf /etc/nginx/nginx.conf
COPY certs /etc/nginx/certs
EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]