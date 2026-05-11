FROM node:24 AS build
WORKDIR /src
RUN npm set registry http://localhost:4873/
COPY ux/frontend/package.json ./
RUN npm install --loglevel=info
COPY ux/frontend/.storybook ./.storybook
COPY ux/frontend/stories ./stories
RUN npm run build-storybook

FROM nginx:stable AS runtime
EXPOSE 80
COPY --from=build /src/storybook-static /usr/share/nginx/html
RUN cat > /etc/nginx/nginx.conf <<'EOF'
worker_processes 1;
events { worker_connections 1024; }
http {
  include       /etc/nginx/mime.types;
  default_type  application/octet-stream;
  server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    location / {
      try_files $uri $uri/ /index.html;
    }
  }
}
EOF
