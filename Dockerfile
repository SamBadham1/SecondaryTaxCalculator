FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

ENV PORT=8080

COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY deploy/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK CMD wget -qO- http://127.0.0.1:8080/ > /dev/null || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
