FROM node:24 AS build
WORKDIR /src
RUN npm set registry http://localhost:4873/

RUN curl http://localhost:4873

COPY ekf/frontend/tsconfig.json ./tsconfig.json
COPY ekf/frontend/package.json ./
RUN npm install --loglevel=info

COPY ekf/frontend/src ./projects/ekf/src
COPY ekf/frontend/tsconfig.app.json ./projects/ekf/tsconfig.app.json
COPY ekf/frontend/federation.config.js ./projects/ekf/federation.config.js
# Rewrite exposes paths from workspace-relative ./src/ to ./projects/ekf/src/
RUN sed -i "s|'./src/|'./projects/ekf/src/|g" projects/ekf/federation.config.js
COPY platform/shared ./projects/shared

# Copy the source angular.json so the node script can read and rewrite it
COPY ekf/frontend/angular.json ./ekf-angular.json

# Generate angular.json at workspace root with paths pointing to projects/ekf
RUN node -e "\
const fs = require('fs'); \
const aj = JSON.parse(fs.readFileSync('ekf-angular.json', 'utf8')); \
const p = aj.projects.ekf; \
p.root = 'projects/ekf'; \
p.sourceRoot = 'projects/ekf/src'; \
const eb = p.architect.esbuild.options; \
eb.browser = 'projects/ekf/src/main.ts'; \
eb.tsConfig = 'projects/ekf/tsconfig.app.json'; \
eb.assets = ['projects/ekf/src/favicon.ico', 'projects/ekf/src/assets']; \
eb.styles = ['projects/ekf/src/styles.scss']; \
p.architect.lint.options.lintFilePatterns = ['projects/ekf/src/**/*.ts', 'projects/ekf/src/**/*.html']; \
fs.writeFileSync('angular.json', JSON.stringify(aj, null, 4)); \
"

RUN npm run build --loglevel=info


FROM nginx:stable AS runtime
EXPOSE 80

# Copy Angular build output
COPY --from=build /src/dist/ekf/browser /usr/share/nginx/html

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
