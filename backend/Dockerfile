FROM oven/bun:1 as base

WORKDIR /app

COPY . .

RUN bun install

CMD ["bun", "run", "server.ts"]