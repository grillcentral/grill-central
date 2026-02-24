FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json ./
COPY pnpm-lock.yaml* ./

RUN pnpm install --no-frozen-lockfile

COPY . .

RUN pnpm build

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
