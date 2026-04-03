FROM node:20-alpine AS build-stage

# Install toolchain for native dependencies
RUN apk add --no-cache python3 make g++ git

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

ARG VUE_APP_API_BASE_URL=http://localhost:8081
ARG VUE_APP_API_URL=http://localhost:8081
ARG VUE_APP_CLIENTID=
ARG VUE_APP_SCOPE=profile email
ARG VUE_APP_PROMPT=select_account

ENV VUE_APP_API_BASE_URL=${VUE_APP_API_BASE_URL}
ENV VUE_APP_API_URL=${VUE_APP_API_URL}
ENV VUE_APP_CLIENTID=${VUE_APP_CLIENTID}
ENV VUE_APP_SCOPE=${VUE_APP_SCOPE}
ENV VUE_APP_PROMPT=${VUE_APP_PROMPT}

RUN npm run build

FROM nginx:alpine AS production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
