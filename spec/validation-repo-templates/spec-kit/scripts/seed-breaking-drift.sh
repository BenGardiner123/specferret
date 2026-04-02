#!/usr/bin/env bash
set -euo pipefail

target="contracts/auth/jwt.contract.md"

if ! test -f "$target"; then
  echo "Missing $target" >&2
  exit 1
fi

python - <<'PY'
from pathlib import Path
p = Path('contracts/auth/jwt.contract.md')
text = p.read_text(encoding='utf-8')
text = text.replace('required: [id, email, token, expiresAt]', 'required: [id, email, token]')
p.write_text(text, encoding='utf-8')
PY

echo "Seeded breaking drift by removing expiresAt from required fields."
