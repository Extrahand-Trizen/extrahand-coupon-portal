FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG VITE_COUPON_SERVICE_URL=http://localhost:4015
ARG VITE_TASK_SERVICE_URL=http://localhost:4002
ARG VITE_PAYMENT_SERVICE_URL=http://localhost:4009
ARG VITE_SERVICE_AUTH_TOKEN=X7fK9qP2Lm8VtR4zWc1YhN6DsB3aU5Jx
ARG VITE_ADMIN_USER_ID=coupon-portal
ARG VITE_API_DIRECT=true
ARG CACHE_BUST=1

ENV VITE_COUPON_SERVICE_URL=${VITE_COUPON_SERVICE_URL}
ENV VITE_TASK_SERVICE_URL=${VITE_TASK_SERVICE_URL}
ENV VITE_PAYMENT_SERVICE_URL=${VITE_PAYMENT_SERVICE_URL}
ENV VITE_SERVICE_AUTH_TOKEN=${VITE_SERVICE_AUTH_TOKEN}
ENV VITE_ADMIN_USER_ID=${VITE_ADMIN_USER_ID}
ENV VITE_API_DIRECT=${VITE_API_DIRECT}

RUN echo "Cache bust: ${CACHE_BUST}" > /dev/null && npm run build

FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
