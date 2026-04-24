FROM node:24 AS build
WORKDIR /src
RUN npm set registry http://localhost:4873/

RUN curl http://localhost:4873

COPY loans/frontend/tsconfig.json ./tsconfig.json
COPY loans/frontend/package.json ./
RUN npm install --loglevel=info

COPY loans/frontend/src ./projects/loans/src
COPY loans/frontend/tsconfig.app.json ./projects/loans/tsconfig.app.json
COPY loans/frontend/federation.config.js ./projects/loans/federation.config.js
# Rewrite exposes paths from workspace-relative ./src/ to ./projects/loans/src/
RUN sed -i "s|'./src/|'./projects/loans/src/|g" projects/loans/federation.config.js
COPY platform/shared ./projects/shared

# Copy the source angular.json so the node script can read and rewrite it
COPY loans/frontend/angular.json ./loans-angular.json

# Generate angular.json at workspace root with paths pointing to projects/loans
RUN node -e "\
const fs = require('fs'); \
const aj = JSON.parse(fs.readFileSync('loans-angular.json', 'utf8')); \
const p = aj.projects.loans; \
p.root = 'projects/loans'; \
p.sourceRoot = 'projects/loans/src'; \
const eb = p.architect.esbuild.options; \
eb.browser = 'projects/loans/src/main.ts'; \
eb.tsConfig = 'projects/loans/tsconfig.app.json'; \
eb.assets = ['projects/loans/src/favicon.ico', 'projects/loans/src/assets']; \
eb.styles = ['projects/loans/src/styles.scss']; \
p.architect.lint.options.lintFilePatterns = ['projects/loans/src/**/*.ts', 'projects/loans/src/**/*.html']; \
fs.writeFileSync('angular.json', JSON.stringify(aj, null, 4)); \
"

RUN npm run build --loglevel=info


FROM nginx:stable AS runtime
EXPOSE 80

# Copy Angular build output
COPY --from=build /src/dist/loans/browser /usr/share/nginx/html

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
