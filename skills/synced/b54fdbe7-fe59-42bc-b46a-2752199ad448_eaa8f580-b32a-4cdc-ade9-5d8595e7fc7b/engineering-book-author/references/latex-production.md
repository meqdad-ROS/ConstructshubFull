# LaTeX production

LaTeX is the production format because engineering books are equation-, figure-, and cross-reference-heavy, and publishers such as Springer, Wiley, Elsevier, CRC Press, and IEEE Press accept or supply LaTeX classes. If the author has a publisher's class (e.g. `svmono` for Springer monographs), use it instead of `book` and adapt the template environments to it — the publisher's rules take priority.

## Project structure (copy from `assets/book-template/`)

```
book/
├── main.tex            % English master (pdfLaTeX or XeLaTeX)
├── main-ar.tex         % Arabic/bilingual master (XeLaTeX only)
├── preamble-en.tex     % packages and settings, English
├── preamble-ar.tex     % packages and settings, Arabic
├── environments.tex    % example, practicenote, problem, solution, objectives
├── notation.tex        % macros for book-wide notation — edit once, used everywhere
├── frontmatter/        % preface.tex, notation-list.tex
├── chapters/           % ch01-*.tex, ch02-*.tex ... one file per chapter
├── figures/            % ch01/, ch02/ ...
├── glossary.tex        % Arabic ↔ English terms (bilingual books)
└── references.bib
```

Each chapter file contains only content (starting at `\chapter{}`), never a preamble, so it can be `\include`d. When producing a single chapter for the author, still provide it as a chapter file plus a note of any new macros to add to `notation.tex`. To compile it for preview, use a copy of the master with `\setcounter{chapter}{N-1}` before the `\include`, so chapter, equation, figure, and example numbers match the real manuscript.

## Conventions

- Labels: `ch:`, `sec:`, `eq:`, `fig:`, `tab:`, `ex:`, `prob:`, `alg:` prefixes with the chapter number, e.g. `\label{eq:3-dh-transform}`. Refer with `\cref{}` (cleveref) and `\eqref{}`.
- Units with `siunitx`: `\SI{2.5}{\newton\metre}` or `\qty{2.5}{\newton\metre}` (siunitx v3); pick one style book-wide.
- Vectors/matrices via notation macros (e.g. `\vect{p}`, `\mat{R}`) rather than raw `\mathbf`, so notation can be changed globally.
- Figures: `\includegraphics[width=\linewidth]{figures/ch03/name}`; captions carry the takeaway; placeholders use `\figplaceholder{brief}` from the template when artwork does not yet exist.
- Algorithms: `algorithm2e`; code: `listings`.
- Bibliography: one shared `references.bib`, but a separate References list at the end of each chapter via `chapterbib` (loaded before `natbib` in the preambles, with the `sectionbib` option so the list appears as an unnumbered section titled "References" / "المراجع"). Every chapter file ends with:
  ```latex
  \bibliographystyle{plainnat}
  \bibliography{references}
  ```
  Only books and peer-reviewed papers go into `references.bib` (see SKILL.md). Use `@book`, `@incollection`, `@article`, and `@inproceedings`; include `doi` when verified. Author–year style (`plainnat`) suits textbooks; switch to a numeric style if the publisher requires it. BibTeX via `natbib`. Never fabricate BibTeX entries. BibTeX does not allow `%` comments inside an entry, so place any `% AUTHOR QUERY` line above the `@book{...}` line, never within it.
- Index key terms with `\index{}` at their defining occurrence.

## Building and checking

- `scripts/build_book.sh main.tex` — runs the correct engine (XeLaTeX for Arabic masters, pdfLaTeX otherwise), runs BibTeX on every chapter's own `.aux` file (required by `chapterbib`), and makes enough passes to resolve references; prints warnings for undefined references/citations and overfull boxes.
- `scripts/check_manuscript.py <book-dir>` — static checks: undefined/unused labels, duplicate labels, unbalanced environments, figures/tables never referenced, `[CITATION NEEDED]` and `AUTHOR QUERY` counts, raw `\mathbf` use outside `notation.tex`, units written without `siunitx`.
- Compile after every chapter delivered when the environment allows it; fix errors before handing over. Render a page or two to an image (e.g. `pdftoppm -png -r 80 -f 1 -l 2`) and look at it to catch layout problems.
