FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json ./
RUN npm install

EXPOSE 3000

CMD ["sh", "-c", "npx prisma generate && npx prisma db push && npm run start:dev"]
