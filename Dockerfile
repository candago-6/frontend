# syntax=docker/dockerfile:1

# --- deps: instala node_modules a partir do lockfile ---------------------------
FROM node:24-alpine AS deps
WORKDIR /app

# Só o manifesto entra nesta etapa: enquanto as dependências não mudarem, o
# cache do npm ci é reaproveitado mesmo quando o código muda.
COPY package.json package-lock.json ./
RUN npm ci

# --- builder: gera o build de produção ----------------------------------------
FROM node:24-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# As variáveis NEXT_PUBLIC_* são embutidas no bundle do navegador durante o
# build, então precisam chegar aqui como ARG — definir no runtime não tem efeito.
ARG NEXT_PUBLIC_API_URL=http://localhost:8002
ARG NEXT_PUBLIC_MOCK_AUTH=false
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_MOCK_AUTH=$NEXT_PUBLIC_MOCK_AUTH

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- runner: imagem final ------------------------------------------------------
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

COPY --from=builder /app/public ./public
# O standalone já traz server.js e o node_modules mínimo; os assets estáticos e
# o public ficam de fora e precisam ser copiados à parte.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
