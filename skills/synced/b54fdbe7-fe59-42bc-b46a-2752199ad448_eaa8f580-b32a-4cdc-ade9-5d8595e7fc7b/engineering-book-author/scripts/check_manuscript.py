#!/usr/bin/env python3
"""Static quality checks for a LaTeX book manuscript.

Usage:  python3 check_manuscript.py <book-dir-or-.tex-file> [more files...]

Reports: duplicate labels, references to undefined labels, labels never
referenced (figures/tables/examples), unbalanced environments, figures/tables
without captions, raw \\mathbf outside notation.tex, bare numeric units not
wrapped in siunitx, and counts of open [CITATION NEEDED] / AUTHOR QUERY items.
Exit code 1 if blocking problems (undefined refs, duplicates, unbalanced envs).
"""
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

REF_CMDS = r"(?:ref|eqref|cref|Cref|autoref|pageref|nameref|vref)"
UNIT_PAT = re.compile(
    r"(?<![\\\w{])(\d+(?:\.\d+)?)\s?(mm|cm|km|kW|MW|W|kV|V|mA|A|Hz|kHz|MHz|lx|lm|Nm|N|kg|Pa|kPa|ms|rad/s)(?![\w}])"
)


def strip_comments(text: str) -> str:
    return "\n".join(re.sub(r"(?<!\\)%.*", "", ln) for ln in text.splitlines())


def collect(paths):
    files = []
    for p in paths:
        p = Path(p)
        files += sorted(p.rglob("*.tex")) if p.is_dir() else [p]
    return files


def main(argv):
    if not argv:
        print(__doc__)
        return 2
    files = collect(argv)
    labels = defaultdict(list)
    refs = defaultdict(list)
    problems, warnings, info = [], [], Counter()

    for f in files:
        raw = f.read_text(encoding="utf-8", errors="replace")
        text = strip_comments(raw)
        info["CITATION NEEDED"] += raw.count("CITATION NEEDED")
        info["AUTHOR QUERY"] += raw.count("AUTHOR QUERY")

        for m in re.finditer(r"\\label\{([^}]+)\}", text):
            labels[m.group(1)].append(f.name)
        for m in re.finditer(r"\\" + REF_CMDS + r"\*?\{([^}]+)\}", text):
            for key in m.group(1).split(","):
                refs[key.strip()].append(f.name)

        # environment balance
        stack = []
        for m in re.finditer(r"\\(begin|end)\{([^}]+)\}", text):
            kind, env = m.groups()
            line = text[: m.start()].count("\n") + 1
            if kind == "begin":
                stack.append((env, line))
            elif not stack or stack[-1][0] != env:
                problems.append(f"{f.name}:{line}: \\end{{{env}}} does not match "
                                f"{'nothing' if not stack else stack[-1][0]}")
                if stack and any(e == env for e, _ in stack):
                    while stack and stack[-1][0] != env:
                        stack.pop()
                    stack and stack.pop()
            else:
                stack.pop()
        for env, line in stack:
            if env != "document" or "\\end{document}" not in text:
                problems.append(f"{f.name}:{line}: \\begin{{{env}}} never closed")

        # captions in floats
        for m in re.finditer(r"\\begin\{(figure|table)\*?\}(.*?)\\end\{\1\*?\}", text, re.S):
            if "\\caption" not in m.group(2):
                line = text[: m.start()].count("\n") + 1
                warnings.append(f"{f.name}:{line}: {m.group(1)} without \\caption")

        if f.name != "notation.tex":
            n = len(re.findall(r"\\mathbf\{", text))
            if n:
                warnings.append(f"{f.name}: {n} raw \\mathbf uses (prefer notation macros)")

        # bare units in text (outside math is hard to detect; heuristic only)
        for m in (UNIT_PAT.finditer(text) if not f.name.startswith("preamble") else []):
            line_txt = text.splitlines()[text[: m.start()].count("\n")]
            if "\\SI" in line_txt or "\\qty" in line_txt or "\\si" in line_txt:
                continue
            line = text[: m.start()].count("\n") + 1
            warnings.append(f"{f.name}:{line}: bare unit '{m.group(0)}' (use \\SI/\\qty)")

    for key, where in labels.items():
        if len(where) > 1:
            problems.append(f"duplicate label '{key}' in {', '.join(where)}")
    for key, where in refs.items():
        if key not in labels:
            problems.append(f"undefined reference '{key}' (used in {', '.join(sorted(set(where)))})")
    for key in labels:
        if key.startswith(("fig:", "tab:")) and key not in refs:
            warnings.append(f"{key} is never referenced in the text")

    print(f"Checked {len(files)} file(s); {len(labels)} labels, {sum(len(v) for v in refs.values())} references.")
    print(f"\nBLOCKING PROBLEMS ({len(problems)}):")
    for p in problems or ["none"]:
        print("  -", p)
    print(f"\nWARNINGS ({len(warnings)}):")
    for w in warnings[:60] or ["none"]:
        print("  -", w)
    if len(warnings) > 60:
        print(f"  ... {len(warnings) - 60} more")
    print(f"\nOPEN ITEMS: {info['CITATION NEEDED']} citation(s) needed, {info['AUTHOR QUERY']} author quer(ies)")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
