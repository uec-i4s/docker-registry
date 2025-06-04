# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
COPY .npmrc ./
RUN npm install
COPY . .
RUN npm run build

# Production stage: Node.js + Docker CLI
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/server.js ./
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
RUN apk add --no-cache docker-cli
EXPOSE 3000
CMD ["npm", "start"]