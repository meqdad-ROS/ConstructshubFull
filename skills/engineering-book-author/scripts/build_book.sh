#!/usr/bin/env bash
# Build a LaTeX book master with the right engine, bibliography, and index.
# Usage: build_book.sh main.tex [--engine xelatex|pdflatex]
set -u
MASTER="${1:?usage: build_book.sh main.tex [--engine xelatex|pdflatex]}"
ENGINE=""
if [ "${2:-}" = "--engine" ]; then ENGINE="${3:-}"; fi
DIR="$(cd "$(dirname "$MASTER")" && pwd)"; BASE="$(basename "$MASTER" .tex)"
cd "$DIR"
if [ -z "$ENGINE" ]; then
  if grep -qE 'preamble-ar|polyglossia|fontspec|xeCJK' "$BASE.tex"; then ENGINE=xelatex; else ENGINE=pdflatex; fi
fi
echo "Engine: $ENGINE"
run() { $ENGINE -interaction=nonstopmode -halt-on-error "$BASE.tex" > /dev/null 2>&1; }
if ! run; then
  echo "FIRST PASS FAILED. Errors:"; grep -E -A3 '^!' "$BASE.log" | head -40
  if grep -q "bidi.sty' not found" "$BASE.log"; then
    echo "NOTE: bidi is missing locally. Compile on Overleaf (XeLaTeX) or a full TeX Live install."
  fi
  exit 1
fi
# chapterbib: each \include'd chapter writes its own .aux with \bibdata
for AUX in "$BASE.aux" $(grep -o '\\@input{[^}]*}' "$BASE.aux" | sed 's/\\@input{\(.*\)}/\1/'); do
  [ -f "$AUX" ] || continue
  if grep -q '\\bibdata' "$AUX"; then
    B="${AUX%.aux}"
    bibtex "$B" > /dev/null 2>&1 || { echo "bibtex problems in $B:"; grep -B1 -A2 -E "^I was expecting|^I couldn|^Repeated entry|^Warning--" "$B.blg" | head -20; }
  fi
done
[ -f "$BASE.idx" ] && command -v makeindex >/dev/null && makeindex "$BASE.idx" > /dev/null 2>&1
run; run
echo "Output: $DIR/$BASE.pdf ($(pdfinfo "$BASE.pdf" 2>/dev/null | awk '/Pages/{print $2}') pages)"
echo "--- Warnings ---"
grep -E "undefined|Citation .* undefined|multiply defined" "$BASE.log" | sort -u | head -30
OVF=$(grep -c "Overfull \\\\hbox" "$BASE.log"); echo "Overfull hboxes: $OVF"
