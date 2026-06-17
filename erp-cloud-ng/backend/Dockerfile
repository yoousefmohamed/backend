FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY . .
RUN npm install --no-audit --no-fund && npm run build && npm prune --omit=dev
EXPOSE 3001
CMD ["node", "dist/main"]
