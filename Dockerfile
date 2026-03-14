FROM node:20-alpine
RUN addgroup -S dashboard && adduser -S dashboard -G dashboard
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --chown=dashboard:dashboard . .
USER dashboard
EXPOSE 3000
CMD ["node", "src/server.js"]
