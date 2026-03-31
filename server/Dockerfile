FROM node:22-bookworm-slim AS base

WORKDIR /app

# Keep OS packages up-to-date at build time to reduce known CVEs.
RUN apt-get update \
	&& apt-get upgrade -y \
	&& rm -rf /var/lib/apt/lists/*

FROM base AS deps

COPY package.json package-lock.json ./
COPY server/package.json ./server/package.json
RUN npm ci --workspace=server --include-workspace-root=false

FROM deps AS build

COPY . .
RUN npm run build --workspace=server

FROM base AS runtime

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY server/package.json ./server/package.json
RUN npm ci --omit=dev --workspace=server --include-workspace-root=false \
	&& npm cache clean --force

COPY --from=build /app/server/dist ./server/dist

WORKDIR /app/server

USER node

CMD ["npm", "run", "start:prod"]
