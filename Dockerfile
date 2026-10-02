# Debian-based Node image: better-sqlite3 ships prebuilt binaries for it.
FROM node:22-slim

WORKDIR /app

# Copy only the package files first so Docker can cache `npm install`
# and skip reinstalling when only your source code changes.
COPY package*.json ./

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

RUN npm install --omit=dev

COPY . .

# The database file lives in /data, which docker-compose mounts as a volume.
ENV DB_PATH=/data/tasks.db

EXPOSE 3000
CMD ["node", "index.js"]