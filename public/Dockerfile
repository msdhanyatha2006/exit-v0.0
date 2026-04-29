# EXIT-VO.O v3.0 — Dockerfile
# No GCC needed — C compilation uses Piston API.
# Just Node.js is enough.

FROM node:20-slim

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]