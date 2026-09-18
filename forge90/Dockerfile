# ---- build: monta o aplicativo de página única a partir de src/ ----
FROM node:22-alpine AS build
WORKDIR /src
COPY build.js VERSION ./
COPY src ./src
COPY server ./server
RUN node build.js

# ---- runtime: servidor Node enxuto e sem dependências ----
FROM node:22-alpine
RUN apk add --no-cache tzdata
WORKDIR /app
COPY --from=build /src/server/server.js ./server.js
COPY --from=build /src/server/lib ./lib
COPY --from=build /src/server/public ./public
COPY --from=build /src/VERSION ./VERSION
ENV NODE_ENV=production \
    PORT=8090 \
    DATA_DIR=/app/data \
    TZ=UTC
VOLUME ["/app/data"]
EXPOSE 8090
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" >/dev/null || exit 1
LABEL org.opencontainers.image.title="FORGE 90" \
      org.opencontainers.image.description="Aplicativo web auto-hospedado de musculação e planejamento de refeições com contas" \
      org.opencontainers.image.source="https://github.com/Oroshi-zz/Forge_90"
CMD ["node", "server.js"]
