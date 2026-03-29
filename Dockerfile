FROM oven/bun:latest
WORKDIR /app

ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV NPM_CONFIG_REGISTRY=https://registry.npmmirror.com
ENV BUN_CONFIG_REGISTRY=https://registry.npmmirror.com
ENV PORT=3000
ENV NODE_ENV=production
ENV ALLOW_REMOTE=true
ENV DATA_DIR=/data

COPY package.json bun.lock .npmrc ./
COPY patches ./patches
RUN for i in 1 2 3 4 5; do bun install --ignore-scripts && exit 0; echo "bun install failed, retry $i"; sleep 3; done; exit 1

COPY . .

RUN bun run build:renderer:web
RUN bun scripts/build-server.mjs

VOLUME ["/data"]
EXPOSE 3000

CMD ["bun", "dist-server/server.mjs"]