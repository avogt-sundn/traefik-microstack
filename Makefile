
# All app services that have a build: context (infrastructure images excluded)
APP_SERVICES := \
  app-spring-partner-search app-quarkus-partner-search partner-search elasticsearch-partner-search \
  app-spring-partner-edit partner-edit \
  shell ekf loans \
  app-one app-two app-three \
  proof-bigint-vs-uuid

network:
	docker network create docker-default-network 2>/dev/null || true

## mirrors — start build mirrors (maven-mirror, npm-mirror) without touching the rest of the stack
mirrors: network
	docker compose --profile mirrors up --wait maven-mirror bootstrap-maven-mirror npm-mirror

## down-mirrors — stop and remove build mirror containers (keeps volumes intact)
down-mirrors:
	docker compose --profile mirrors stop maven-mirror bootstrap-maven-mirror npm-mirror build-services

## up — build changed images (git-hash guard), then start the full stack
up: mirrors build-changed
	docker compose up -d

## build-changed — rebuild only services whose source domain changed since last build
build-changed:
	@for svc in $(APP_SERVICES); do scripts/build-if-changed.sh $$svc; done

down:
	docker compose down --volumes

## down-all — stop and remove containers from all profiles, including orphans
down-all:
	docker compose --profile loadbalancing down --remove-orphans

log:
	docker compose logs -f $(SERVICE)

## rebuild SERVICE=<name>  — rebuild one service image if its domain changed, then restart
##   Always use this instead of docker compose -f <sub-file> to avoid duplicate containers.
##   Example: make rebuild SERVICE=app-spring-partner-search
rebuild: network
	scripts/build-if-changed.sh $(SERVICE)
	docker compose up -d --force-recreate $(SERVICE)

## rebuild-force SERVICE=<name>  — unconditional rebuild, bypasses git-hash guard
rebuild-force: network
	scripts/build-if-changed.sh $(SERVICE) --force
	docker compose up -d --force-recreate $(SERVICE)

## restart SERVICE=<name>  — restart one service without rebuilding (re-runs migrations)
##   Example: make restart SERVICE=app-spring-partner
restart:
	docker compose up -d --force-recreate $(SERVICE)

## partners:load COUNT=<n>  — wipe spring-partner-search DB+ES, load N fresh records, re-index
##   Default COUNT=12003000, max 10,000,000. Example: make partners:load COUNT=500000
partners\:load:
	partner-search/scripts/load-partners.sh $(or $(COUNT),1200300)

## loadbalancing — start whoami replicas + smoke test (loadbalancing profile)
loadbalancing: network
	docker compose --profile loadbalancing up --build -d whoami test-loadbalancing

# --- Playwright targets ---

## pw:run         — run API-only e2e suite (no browser, fast, same as CI default)
pw-run:
	docker run --name pw-run-tmp --network docker-default-network -e BASE_URL=https://gateway -e PW_PROJECT=api traefik-microstack-e2e-tests; EC=$$?; docker logs pw-run-tmp; docker rm pw-run-tmp; exit $$EC

## pw:run-browser — run browser (Angular UI) e2e suite inside the Playwright container
pw-run-browser:
	docker run --name pw-run-tmp --network docker-default-network -e BASE_URL=https://gateway -e PW_PROJECT=browser traefik-microstack-e2e-tests; EC=$$?; docker logs pw-run-tmp; docker rm pw-run-tmp; exit $$EC
pw-run-api:
	docker run --name pw-run-tmp --network docker-default-network -e BASE_URL=https://gateway -e PW_PROJECT=api traefik-microstack-e2e-tests; EC=$$?; docker logs pw-run-tmp; docker rm pw-run-tmp; exit $$EC

## pw:run-all     — run both api and browser e2e suites
pw-run-all:
	docker run --name pw-run-tmp --network docker-default-network -e BASE_URL=https://gateway -e PW_PROJECT=all traefik-microstack-e2e-tests; EC=$$?; docker logs pw-run-tmp; docker rm pw-run-tmp; exit $$EC

## pw:local — run api tests directly in the devcontainer against the live stack
pw-local:
	SCREENSHOTS=true cd tests && BASE_URL=https://gateway npx playwright test --project=api

## pw:local-browser — run browser tests directly in the devcontainer
pw-local-browser:
	SCREENSHOTS=true cd tests && BASE_URL=https://gateway npx playwright test --project=browser

## pw:report — serve the last HTML report at http://localhost:9323
pw-report:
	cd tests && npx playwright show-report target/report --port 9323 --host 0.0.0.0

## pw:trace — open the trace viewer for the most recent failing test
##            Override with: make pw:trace TRACE=target/test-results/<name>/trace.zip
TRACE ?= $(shell ls -t tests/target/test-results/*/trace.zip 2>/dev/null | head -1)
pw-trace:
	@if [ -z "$(TRACE)" ]; then \
	  echo "No trace files found. Run 'make pw:local' with --trace on first."; \
	  exit 1; \
	fi
	cd tests && npx playwright show-trace ../$(TRACE)

# ── Lab proof targets ─────────────────────────────────────────────────────────

## lab-bigint-vs-uuid — run the BIGINT vs UUIDv4 vs UUIDv7 primary key benchmark (~3 min)
lab-bigint-vs-uuid: network
	docker compose build proof-bigint-vs-uuid
	docker compose run --rm proof-bigint-vs-uuid

## axioms — print all axiom blocks in knowledge-hierarchy order
axioms:
	@for f in CLAUDE.md .claude/agents/*.md; do \
	  awk -v f="$$f" '/^## Axioms|^## Behavioral Rules/{p=1;print "";print "### " f;next} p&&/^## /{p=0} p' "$$f"; \
	done

## axioms-encode — generate .axioms pack files from .claude/axioms/axiom-map.tsv
axioms-encode:
	@bash scripts/encode-axioms.sh

## axioms-check — verify all natural-language axiom IDs are present in axiom-map.tsv
axioms-check:
	@bash scripts/encode-axioms.sh --check

## publish — export a clean public snapshot (excludes .claude/, .youtube/, private/)
publish:
	$(MAKE) -C private publish

# ── Angular frontend dev-server targets ───────────────────────────────────────
# Run one of these inside the devcontainer while the Compose stack is up.
# The socat forward-<domain> container is already listening; once ng serve
# starts on the expected port it becomes healthy and Traefik routes live
# requests through it instead of the packaged nginx container.
#
# Each domain frontend is self-contained: it depends on @traefik-microstack/shared
# published to the local Verdaccio registry — NOT on platform/shared source.
# Run 'make shared' after touching platform/shared to republish.
#
# Status:
#   dev-shell   ✓ ready   (platform/shell)
#   dev-partner ✓ ready   (partner-search/frontend — decoupled)
#   dev-ekf     ✗ needs decoupling (see partner-search/frontend as the reference)
#   dev-loans   ✗ needs decoupling + forward-loans socat container

NPM_MIRROR ?= localhost:4873

## shared — rebuild and publish @traefik-microstack/shared to Verdaccio (run after editing platform/shared)
## In devcontainer: NPM_MIRROR is set to npm-mirror:4873 via containerEnv. On host: defaults to localhost:4873.
shared:
	cd platform && node_modules/.bin/ng build shared
	cd dist/shared && npm publish --registry http://$(NPM_MIRROR) || \
	  (node -e "const p=require('./package.json'); const v=p.version.split('.'); v[2]=+v[2]+1; p.version=v.join('.'); require('fs').writeFileSync('./package.json',JSON.stringify(p,null,2)+'\n')" && \
	   npm publish --registry http://$(NPM_MIRROR))

## dev-shell — live-reload platform shell on port 4200 via forward-ng-shell
dev-shell:
	@[ -d platform/node_modules ] || (echo "Installing platform deps..." && cd platform && npm install)
	cd platform && node_modules/.bin/ng serve shell --port 4200

## dev-partner — live-reload partner-search micro-frontend on port 4202 via forward-ng-partner-search
dev-partner:
	@[ -d partner-search/frontend/node_modules ] || (echo "Installing partner-search deps..." && cd partner-search/frontend && npm install)
	cd partner-search/frontend && node_modules/.bin/ng serve partner-search --port 4202

## dev-ekf — live-reload EKF micro-frontend on port 4203 via forward-ng-ekf  [needs decoupling first]
dev-ekf:
	@[ -d ekf/frontend/node_modules ] || (echo "Installing ekf deps..." && cd ekf/frontend && npm install)
	cd ekf/frontend && node_modules/.bin/ng serve ekf --port 4203

## dev-loans — live-reload loans micro-frontend on port 4201  [needs decoupling + forward-loans container]
dev-loans:
	@[ -d loans/frontend/node_modules ] || (echo "Installing loans deps..." && cd loans/frontend && npm install)
	cd loans/frontend && node_modules/.bin/ng serve loans --port 4201

.PHONY: network mirrors down-mirrors up build-changed down down-all rebuild rebuild-force shared dev-shell dev-partner dev-ekf dev-loans axioms loadbalancing pw-run pw-run-browser pw-run-all pw-local pw-local-browser pw-report pw-trace pw-dashboard partners\:load lab-bigint-vs-uuid

## pw:dashboard — print the dashboard URL (stack must be running)
pw-dashboard:
	@echo "E2E dashboard: http://localhost:9090"
	@echo "Playwright report: http://localhost:9090/report/"
	@echo "Raw XML: http://localhost:9090/results/smoke.xml"
