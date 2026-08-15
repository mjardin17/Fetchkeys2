FROM node:24-alpine AS build
WORKDIR /workspace
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
ENV PORT=20041
ENV BASE_PATH=/
RUN pnpm --filter @workspace/bosskey-private run build
RUN pnpm --filter @workspace/api-server run build

FROM node:24-alpine AS runtime
RUN addgroup -S -g 10001 bosskey && adduser -S -u 10001 -G bosskey bosskey
WORKDIR /app
COPY --from=build /workspace/artifacts/bosskey-private/dist/public ./public
COPY --from=build /workspace/artifacts/bosskey-private/server.mjs ./server.mjs
COPY --from=build /workspace/artifacts/api-server/dist/index.mjs ./api/index.mjs
RUN mkdir -p /data && chown -R bosskey:bosskey /app /data
USER bosskey
ENV HOST=0.0.0.0
ENV PORT=4789
ENV DATA_DIR=/data
ENV TELEMETRY_ENABLED=false
EXPOSE 4789
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:4789/api/healthz').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "server.mjs"]