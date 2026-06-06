# REDBASE production image: builds the React client, then serves API + static client.
FROM node:20-alpine

WORKDIR /app

# Install backend deps (and prisma CLI) first for layer caching.
COPY package*.json ./
COPY prisma ./prisma
RUN npm install --omit=dev && npx prisma generate

# Build the client.
COPY client/package*.json ./client/
RUN npm --prefix client install
COPY client ./client
RUN npm --prefix client run build

# Copy the rest of the backend source.
COPY server ./server

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "server/src/index.js"]
