#!/bin/bash

# Create a new NowStack Mobile doc in docs/ from the template.
# Usage:   ./create-doc.sh <filename> "<title>" "<description>"
# Example: ./create-doc.sh web-app-routing "Web App Routing" "TanStack Start route conventions"

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_PATH="$SCRIPT_DIR/../templates/doc-template.md"
DOCS_DIR="$(cd "$SCRIPT_DIR/../../../../docs" && pwd)"

if [ -z "$1" ]; then
    echo "Usage: $0 <filename> \"<title>\" \"<description>\""
    echo "Example: $0 web-app-routing \"Web App Routing\" \"TanStack Start route conventions\""
    exit 1
fi

# kebab-case filename, no extension (docs are always .md)
FILENAME="$1"
FILENAME="${FILENAME%.mdx}"
FILENAME="${FILENAME%.md}"

if [[ ! "$FILENAME" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
    echo "Error: filename must be a kebab-case basename (no slashes or '..'): $FILENAME"
    exit 1
fi

TITLE="${2:-$FILENAME}"
DESCRIPTION="${3:-TODO: Add description}"

OUTPUT_PATH="$DOCS_DIR/$FILENAME.md"
if [ -f "$OUTPUT_PATH" ]; then
    echo "Error: file already exists: docs/$FILENAME.md"
    echo "Edit it directly instead of regenerating."
    exit 1
fi

# Escape sed replacement metacharacters. The filename validation above keeps
# OUTPUT_PATH inside docs/; title/description are content only.
escape_replacement() {
    printf '%s' "$1" | sed 's/[\\&|]/\\&/g'
}

SAFE_TITLE="$(escape_replacement "$TITLE")"
SAFE_DESCRIPTION="$(escape_replacement "$DESCRIPTION")"
sed -e "s|{{TITLE}}|$SAFE_TITLE|g" \
    -e "s|{{DESCRIPTION}}|$SAFE_DESCRIPTION|g" \
    "$TEMPLATE_PATH" > "$OUTPUT_PATH"

echo "Created: docs/$FILENAME.md"
echo ""
echo "Next:"
echo "  1. Fill 'Relevant Files' with real repo paths."
echo "  2. Write the Workflow as exact, runnable steps."
echo "  3. Add Verification commands for the touched surface."
echo "  4. Link it where a reader would look (AGENTS.md or a sibling doc)."
