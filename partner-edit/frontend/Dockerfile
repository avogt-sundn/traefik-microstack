FROM node:24 AS build
WORKDIR /src
RUN npm set registry http://localhost:4873/

RUN curl http://localhost:4873

COPY partner-edit/frontend/tsconfig.json ./tsconfig.json
COPY partner-edit/frontend/package.json ./
RUN npm install --loglevel=info

COPY partner-edit/frontend/src ./projects/partner-edit/src
COPY partner-edit/frontend/tsconfig.app.json ./projects/partner-edit/tsconfig.app.json
# Restore Docker-relative paths in tsconfig.app.json (local version uses workspace-relative paths)
RUN sed -i 's|"./tsconfig.json"|"../../tsconfig.json"|; s|"rootDir": "."|"rootDir": ".."|' projects/partner-edit/tsconfig.app.json
COPY partner-edit/frontend/federation.config.js ./projects/partner-edit/federation.config.js
# Rewrite exposes paths from workspace-relative ./src/ to ./projects/partner-edit/src/
RUN sed -i "s|'./src/|'./projects/partner-edit/src/|g" projects/partner-edit/federation.config.js
COPY platform/shared ./projects/shared

# Copy the source angular.json so the node script can read and rewrite it
COPY partner-edit/frontend/angular.json ./partner-edit-angular.json

# Generate angular.json at workspace root with paths pointing to projects/partner-edit
RUN node -e "\
const fs = require('fs'); \
const aj = JSON.parse(fs.readFileSync('partner-edit-angular.json', 'utf8')); \
const p = aj.projects['partner-edit']; \
p.root = 'projects/partner-edit'; \
p.sourceRoot = 'projects/partner-edit/src'; \
const eb = p.architect.esbuild.options; \
eb.browser = 'projects/partner-edit/src/main.ts'; \
eb.tsConfig = 'projects/partner-edit/tsconfig.app.json'; \
eb.assets = ['projects/partner-edit/src/favicon.ico', 'projects/partner-edit/src/assets']; \
eb.styles = ['projects/partner-edit/src/styles.scss']; \
p.architect.lint.options.lintFilePatterns = ['projects/partner-edit/src/**/*.ts', 'projects/partner-edit/src/**/*.html']; \
fs.writeFileSync('angular.json', JSON.stringify(aj, null, 4)); \
"

RUN npm run build --loglevel=info


FROM nginx:stable AS runtime
EXPOSE 80

# Copy Angular build output
COPY --from=build /src/dist/partner-edit/browser /usr/share/nginx/html

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
