#!/usr/bin/env bash
set -euo pipefail

timestamp="$(date +%Y%m%d-%H%M%S)"
outdir=".repo-diagnostics/report-${timestamp}"
mkdir -p "${outdir}"

log() { echo "[$(date +%H:%M:%S)] $*" | tee -a "${outdir}/diagnose.log"; }
save() { tee -a "${outdir}/$1" >/dev/null; }

log "== Instruction-prompt-engine: Repo Diagnose Started =="

# System info
{
  echo "Timestamp: ${timestamp}"
  echo "OS: $(uname -a || true)"
  echo "Node: $(command -v node >/dev/null 2>&1 && node -v || echo 'N/A')"
  echo "npm:  $(command -v npm  >/dev/null 2>&1 && npm -v  || echo 'N/A')"
  echo "pnpm: $(command -v pnpm >/dev/null 2>&1 && pnpm -v || echo 'N/A')"
  echo "yarn: $(command -v yarn >/dev/null 2>&1 && yarn -v || echo 'N/A')"
  echo "Python: $(command -v python >/dev/null 2>&1 && python --version 2>&1 || echo 'N/A')"
} | save "system.txt"

# Detect package manager preference
pm=""
if [[ -f "pnpm-lock.yaml" ]] && command -v pnpm >/dev/null 2>&1; then pm="pnpm"
elif [[ -f "yarn.lock" ]] && command -v yarn >/dev/null 2>&1; then pm="yarn"
elif [[ -f "package-lock.json" ]] && command -v npm >/dev/null 2>&1; then pm="npm"
elif [[ -f "package.json" ]]; then
  if command -v pnpm >/dev/null 2>&1; then pm="pnpm"
  elif command -v yarn >/dev/null 2>&1; then pm="yarn"
  elif command -v npm >/dev/null 2>&1; then pm="npm"
  fi
fi

log "Detected package manager: ${pm:-none}"

# Install Node deps (best-effort)
if [[ -f "package.json" && -n "${pm}" ]]; then
  log "Installing Node dependencies..."
  set +e
  if [[ "${pm}" == "pnpm" ]]; then pnpm install --frozen-lockfile 2>&1 | save "node_install.log"
  elif [[ "${pm}" == "yarn" ]]; then yarn install --frozen-lockfile 2>&1 | save "node_install.log"
  else npm ci 2>&1 | save "node_install.log"
  fi
  set -e

  log "Dependency tree..."
  set +e
  if [[ "${pm}" == "pnpm" ]]; then pnpm list --depth=Infinity 2>&1 | save "node_deps_tree.txt"
  elif [[ "${pm}" == "yarn" ]]; then yarn list --pattern "" 2>&1 | save "node_deps_tree.txt"
  else npm ls --all 2>&1 | save "node_deps_tree.txt"
  fi
  set -e

  log "Running lint (if present)..."
  set +e
  if [[ "${pm}" == "pnpm" ]]; then pnpm -s run lint 2>&1 | save "lint.log"
  elif [[ "${pm}" == "yarn" ]]; then yarn -s lint 2>&1 | save "lint.log"
  else npm run -s lint 2>&1 | save "lint.log"
  fi
  set -e

  if [[ -f "tsconfig.json" ]]; then
    log "Typechecking with tsc..."
    set +e
    npx -y tsc --noEmit 2>&1 | save "typecheck.log"
    set -e
  fi

  log "Running tests (if present)..."
  set +e
  if [[ "${pm}" == "pnpm" ]]; then pnpm -s test -- --reporters=default 2>&1 | save "test.log"
  elif [[ "${pm}" == "yarn" ]]; then yarn -s test 2>&1 | save "test.log"
  else npm test --silent 2>&1 | save "test.log"
  fi
  set -e

  log "Building project (if present)..."
  set +e
  if [[ "${pm}" == "pnpm" ]]; then pnpm -s run build 2>&1 | save "build.log"
  elif [[ "${pm}" == "yarn" ]]; then yarn -s build 2>&1 | save "build.log"
  else npm run -s build 2>&1 | save "build.log"
  fi
  set -e
fi

# Basic static checks
log "Scanning for dead/large files and common smells..."
scan="${outdir}/code_scan.txt"
{ 
  echo "Large files (>1k lines):"
  awk 'BEGIN{FS=":"} {if(NR%1==0)print}' <(find . -type f -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.repo-diagnostics/*" -name "*.*" -exec awk 'END{print FILENAME ":" NR}' {} \; | sort -t: -k2,2nr | head -n 50)
  echo
  echo "TODO/FIXME/BUG markers:"
  grep -RIn --exclude-dir={node_modules,dist,.repo-diagnostics} -E "TODO|FIXME|BUG|HACK" . || true
  echo
  echo "Potential secrets (best-effort):"
  grep -RIn --exclude-dir={node_modules,dist,.repo-diagnostics} -E "(API[_-]?KEY|SECRET|TOKEN|PASSWORD|PRIVATE[_-]?KEY)" . || true
} > "${scan}"

log "== Diagnose Completed =="
echo "Artifacts: ${outdir}"