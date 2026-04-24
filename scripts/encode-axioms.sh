#!/usr/bin/env bash
# encode-axioms.sh — generate .axioms pack files from axiom-map.tsv
# Usage: scripts/encode-axioms.sh [--check]
#   --check: verify all natural-language axiom IDs are present in axiom-map.tsv; exit nonzero if any missing
#
# Pack files are written to .claude/axioms/<pack>.axioms
# Each line in a pack file: ID VERB compressed-rule | violation-pattern

set -euo pipefail

AXIOMS_DIR=".claude/axioms"
MAP_FILE="$AXIOMS_DIR/axiom-map.tsv"
EXCLUDE_FILE="$AXIOMS_DIR/exclude-map.txt"
CHECK_ONLY=0

if [[ "${1:-}" == "--check" ]]; then
  CHECK_ONLY=1
fi

if [[ ! -f "$MAP_FILE" ]]; then
  echo "ERROR: $MAP_FILE not found" >&2
  exit 1
fi

# Extract all axiom IDs from natural-language sources (reuse make axioms logic)
extract_nl_ids() {
  for f in CLAUDE.md .claude/agents/*.md; do
    awk '/^## Axioms|^## Behavioral Rules/{p=1;next} p&&/^## /{p=0} p&&/^\- \*\*\[/{id=$0; gsub(/.*\[/,"",id); gsub(/\].*/,"",id); print id}' "$f" 2>/dev/null
  done
}

# Extract mapped IDs from axiom-map.tsv (non-comment, non-empty lines, first column)
extract_map_ids() {
  grep -v '^#' "$MAP_FILE" | grep -v '^[[:space:]]*$' | cut -f1
}

if [[ "$CHECK_ONLY" -eq 1 ]]; then
  NL_IDS=$(extract_nl_ids | sort -u)
  MAP_IDS=$(extract_map_ids | sort -u)
  EXCLUDED_IDS=""
  if [[ -f "$EXCLUDE_FILE" ]]; then
    EXCLUDED_IDS=$(grep -v '^#' "$EXCLUDE_FILE" | grep -v '^[[:space:]]*$' | cut -f1 | sort -u)
  fi
  ACCOUNTED=$(printf '%s\n%s' "$MAP_IDS" "$EXCLUDED_IDS" | sort -u)
  MISSING=$(comm -23 <(echo "$NL_IDS") <(echo "$ACCOUNTED"))
  if [[ -n "$MISSING" ]]; then
    echo "ERROR: the following axiom IDs are unaccounted for (add to axiom-map.tsv or exclude-map.txt):" >&2
    echo "$MISSING" >&2
    exit 1
  fi
  NL_COUNT=$(echo "$NL_IDS" | wc -l | tr -d ' ')
  MAP_COUNT=$(echo "$MAP_IDS" | wc -l | tr -d ' ')
  EXCL_COUNT=$(echo "$EXCLUDED_IDS" | grep -c '' 2>/dev/null || echo 0)
  echo "axioms-check: $NL_COUNT natural-language axioms — $MAP_COUNT encoded, $EXCL_COUNT intentionally excluded. OK."
  exit 0
fi

# Generate pack files
declare -A PACK_CONTENT

while IFS=$'\t' read -r id verb rule violation pack; do
  # Skip comments and blank lines
  [[ "$id" =~ ^# ]] && continue
  [[ -z "$id" ]] && continue
  PACK_CONTENT["$pack"]+="${id} ${verb} ${rule} | ${violation}"$'\n'
done < "$MAP_FILE"

for pack in "${!PACK_CONTENT[@]}"; do
  outfile="$AXIOMS_DIR/${pack}.axioms"
  printf '%s' "${PACK_CONTENT[$pack]}" > "$outfile"
  count=$(grep -c '' "$outfile")
  echo "wrote $outfile ($count axioms)"
done

echo "axioms-encode: done."
