FROM node:20-alpine AS base
WORKDIR /repo

COPY package.json package-lock.json* ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN npm install --workspace=apps/api --workspace=packages/shared --include-workspace-root
RUN npm run build --workspace=packages/shared

WORKDIR /repo/apps/api
RUN npx prisma generate
RUN npm run build

EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
