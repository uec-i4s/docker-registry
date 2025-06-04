# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
COPY .npmrc ./
RUN npm install
COPY . .
RUN npm run build

# Production stage: Node.js + Docker CLI
FROM docker:24.0.7-cli
WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/server.js ./
COPY --from=build /app/package.json ./
RUN apk add --no-cache nodejs npm
RUN npm install --omit=dev
RUN npm install http-proxy-middleware
EXPOSE 3000
CMD ["npm", "start"]