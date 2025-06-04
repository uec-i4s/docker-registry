# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
COPY .npmrc ./
RUN npm install
COPY . .
RUN npm run build

# Production nginx stage
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80