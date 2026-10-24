# Revising drafts and editing the final manuscript

The author's own ideas, findings, and voice are the asset. Revision strengthens them; it must never replace the author's technical content or opinions with Claude's. When something looks technically wrong, flag it with a comment rather than silently changing the meaning.

## Three passes, in order

Work from large to small. Fixing commas in a section that will be restructured wastes effort.

### Pass 1 — Developmental (structure and teaching)
- Does the chapter follow a learnable arc (motivation → intuition → model → examples → practice)?
- Are objectives stated, and does the content deliver them?
- Is anything missing (examples, a derivation step, a figure) or redundant?
- Is the level consistent with the declared reader?
- Output: a short revision plan, then the restructured text.

### Pass 2 — Line editing (clarity and voice)
- One idea per paragraph; topic sentences; logical transitions.
- Replace vague words with precise technical terms; cut filler and repetition.
- Active voice where it clarifies; consistent tense.
- Preserve the author's characteristic phrasing when it is correct and clear — the book should still sound like him.
- Remove machine-sounding patterns (see craft-principles §5).

### Pass 3 — Copyediting and technical consistency
- Notation matches the book's notation table; every symbol defined at first use.
- Units in SI via `\SI{}{}`/`\si{}`; consistent decimal and thousands separators.
- Equations numbered consistently; every `\ref` resolves; every figure/table referenced before it appears.
- Terminology consistent (keep a running glossary; for Arabic, see `arabic-and-bilingual.md`).
- Spelling variant chosen once (British or American English) and applied throughout.
- Citations complete; flag gaps with `[CITATION NEEDED: …]`.

## How to present revisions

- For short passages: give the revised text, followed by a brief list of the substantive changes and any points for the author to confirm.
- For long passages or whole chapters: deliver the revised `.tex` file, and a short change log. If the author wants to see changes inline, use `% EDIT:` LaTeX comments or the `changes` package (`\added{}`, `\deleted{}`, `\replaced{}{}`).
- Technical doubts go in `% AUTHOR QUERY:` comments at the relevant line, and are summarised in the author's checklist.

## Final-manuscript edit (before submission to a publisher)

Run the whole-book checks: `scripts/check_manuscript.py` on the project, then a full compile with `scripts/build_book.sh` and inspect the log for overfull boxes, undefined references, and missing citations. Also check: consistent chapter openings, front matter complete (title page, preface, contents, notation list), index entries on key terms (`\index{}`), bibliography style consistent, figure resolution and permissions noted, and the publisher's own template or style guide if the author has one (publisher requirements override this skill's template).
