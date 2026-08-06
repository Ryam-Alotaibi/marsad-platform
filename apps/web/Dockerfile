FROM node:20-alpine AS base
WORKDIR /repo

COPY package.json package-lock.json* ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
RUN npm install --workspace=apps/web --workspace=packages/shared --include-workspace-root
RUN npm run build --workspace=packages/shared

WORKDIR /repo/apps/web
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
