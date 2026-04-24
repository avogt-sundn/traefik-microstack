FROM node:24 AS build
WORKDIR /src
RUN npm set registry http://localhost:4873/

RUN curl http://localhost:4873

COPY partner-search/frontend/tsconfig.json ./tsconfig.json
COPY partner-search/frontend/package.json ./
RUN npm install --loglevel=info

COPY partner-search/frontend/src ./projects/partner-search/src
COPY partner-search/frontend/tsconfig.app.json ./projects/partner-search/tsconfig.app.json
# Restore Docker-relative paths in tsconfig.app.json (local version uses workspace-relative paths)
RUN sed -i 's|"./tsconfig.json"|"../../tsconfig.json"|; s|"rootDir": "."|"rootDir": ".."|' projects/partner-search/tsconfig.app.json
COPY partner-search/frontend/federation.config.js ./projects/partner-search/federation.config.js
# Rewrite exposes paths from workspace-relative ./src/ to ./projects/partner-search/src/
RUN sed -i "s|'./src/|'./projects/partner-search/src/|g" projects/partner-search/federation.config.js
COPY platform/shared ./projects/shared

# Copy the source angular.json so the node script can read and rewrite it
COPY partner-search/frontend/angular.json ./partner-angular.json

# Generate angular.json at workspace root with paths pointing to projects/partner-search
RUN node -e "\
const fs = require('fs'); \
const aj = JSON.parse(fs.readFileSync('partner-angular.json', 'utf8')); \
const p = aj.projects['partner-search']; \
p.root = 'projects/partner-search'; \
p.sourceRoot = 'projects/partner-search/src'; \
const eb = p.architect.esbuild.options; \
eb.browser = 'projects/partner-search/src/main.ts'; \
eb.tsConfig = 'projects/partner-search/tsconfig.app.json'; \
eb.assets = ['projects/partner-search/src/favicon.ico', 'projects/partner-search/src/assets']; \
eb.styles = ['projects/partner-search/src/styles.scss']; \
p.architect.lint.options.lintFilePatterns = ['projects/partner-search/src/**/*.ts', 'projects/partner-search/src/**/*.html']; \
fs.writeFileSync('angular.json', JSON.stringify(aj, null, 4)); \
"

RUN npm run build --loglevel=info


FROM nginx:stable AS runtime
EXPOSE 80

# Copy Angular build output
COPY --from=build /src/dist/partner-search/browser /usr/share/nginx/html

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
