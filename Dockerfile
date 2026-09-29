FROM node:lts-alpine
RUN apk add --no-cache openssl
ENV DATABASE_URL=file:/usr/src/app/data/shop.db
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci --include=dev
COPY . .
RUN npx prisma generate && npm run build
RUN mkdir -p /usr/src/app/data && chown -R node:node /usr/src/app
ENV NODE_ENV=production
EXPOSE 3000
USER node
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
