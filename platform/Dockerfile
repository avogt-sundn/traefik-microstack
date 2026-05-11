FROM node:24 AS build
WORKDIR /src
RUN npm set registry http://localhost:4873/

RUN curl http://localhost:4873

COPY tsconfig.json package.json angular.json ./
RUN npm install --loglevel=info

COPY ./shell ./shell
COPY ./shared ./shared
RUN npm run build:shell --loglevel=info


FROM nginx:stable AS runtime
EXPOSE 80

# Copy Angular build output
COPY --from=build /src/dist/shell/browser /usr/share/nginx/html

# Override nginx.conf: enable MIME types + SPA fallback
RUN cat > /etc/nginx/nginx.conf <<EOF
worker_processes 1;

events {
  worker_connections 1024;
}

http {
  include       /etc/nginx/mime.types;
  default_type  application/octet-stream;

  server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
      try_files \$uri \$uri/ /index.html;
    }
  }
}
EOF
