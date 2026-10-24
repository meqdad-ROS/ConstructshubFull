# Arabic and bilingual engineering writing

Arabic scientific writing has a long and distinguished tradition, and a modern Arabic engineering book should read as fluent Modern Standard Arabic (الفصحى المعاصرة), not as translated English. These notes cover the decisions that must be made before writing.

## 1. Terminology policy (decide once, record in a glossary)

- Prefer established Arabic technical terms where they exist and are used in Arab universities and standards bodies (e.g. the Arab academies of language, the Unified Dictionary series of the Arab League Educational, Cultural and Scientific Organization (ALECSO), and national standards bodies). If unsure whether a term is established, flag it for the author rather than coining silently.
- On first use of each key term in a chapter, give the English equivalent in parentheses: المتحكم التناسبي التكاملي التفاضلي (PID controller). Afterwards, use the Arabic term alone, or the accepted abbreviation.
- Keep a bilingual glossary file (`glossary.tex`, Arabic ↔ English) for the whole book and add every new term to it. Terminology drift is the most common flaw in Arabic technical books.
- Where the field genuinely uses the English acronym (IoT, LiDAR, PID, SLAM), keep the acronym in Latin script and explain it once.

## 2. Prose style

- Use clear MSA with well-constructed sentences; avoid excessively long chains of و-joined clauses — split them.
- Prefer nominal and verbal sentences naturally; do not mirror English passive constructions mechanically (use نقوم بـ sparingly; prefer direct verbs: نحسب، نشتق، نصمم).
- Use scholarly connectives precisely: ومن ثَمّ، وبناءً على ذلك، وتجدر الإشارة إلى، أي، وعليه.
- Add diacritics (تشكيل) only where needed to prevent ambiguity (e.g. مُتحكِّم vs. مُتحكَّم).
- The author's-voice "we" (نحن) is natural in Arabic textbooks: "نفترض"، "نلاحظ".

## 3. Numbers, symbols, and equations

- Mathematics stays left-to-right with Latin symbols and Western Arabic numerals (0–9) in equations; this is standard practice in Arab universities' engineering texts. In running text, decide once between Western (0–9) and Eastern Arabic-Indic numerals (٠–٩) and apply consistently; Western numerals are the safer default for engineering.
- Units: SI symbols in Latin script inside equations and values (e.g. 500 lx, 3 kW); the unit name may be written in Arabic in prose (لوكس، كيلوواط).
- Variable names in the text are set in math mode: "حيث $P$ هي القدرة الكهربائية بوحدة الواط".
- Numbering such as 9.1 is displayed with the chapter number on the right in right-to-left text (it appears as "1.9" to a left-to-right eye); this is the normal Arabic convention and should be explained to the author, not "fixed".
- Arabic labels for figures and tables: شكل ١-٢ or شكل 1-2 (follow the numeral decision), جدول، مثال محلول، تمارين، ملخص الفصل، أهداف التعلم، قراءات إضافية.

## 4. Bilingual formats

Clarify which the author wants:
- **Arabic book with English terms** (most common): Arabic main language, English terms in parentheses, English-language references in the bibliography.
- **Parallel editions**: separate Arabic and English manuscripts sharing the same figures, equations, labels, and notation file. Write the English master first unless the author prefers otherwise, then produce an *adapted* Arabic version (natural Arabic, not literal translation), keeping all `\label` keys identical so cross-references work in both.
- **Side-by-side / glossary-heavy** (e.g. for teaching terminology): use `paracol` for two columns.

## 5. LaTeX for Arabic

- Compile with **XeLaTeX**, using `polyglossia` (`\setmainlanguage{arabic}`, `\setotherlanguage{english}`) and `bidi` (loaded automatically by polyglossia under XeLaTeX), plus an Arabic OpenType font (Amiri is the recommended default for body text; Noto Naskh Arabic and Scheherazade New are alternatives; a sans font such as Noto Sans Arabic for headings).
- Wrap every English term of two or more words with `\textenglish{...}`, including terms in parentheses: `(\textenglish{Lumen Method})`. Without it, the bidirectional algorithm lays the words out right-to-left and the reader sees "Method Lumen". Single words and acronyms (LED, IoT) are safe but may be wrapped for consistency. Use the `english` environment for whole English passages, and `\textarabic{...}` for Arabic inside English documents.
- After compiling, render one page and look at the English terms; reversed word order is the most common defect in Arabic technical LaTeX and is invisible in the source.
- Load `polyglossia` late in the preamble per its documentation; load `hyperref` before `polyglossia`/`bidi` as `bidi` requires.
- Use `assets/book-template/preamble-ar.tex`.
- Citations inside Arabic prose: wrap them as `\textenglish{\citep{key}}` so author names and years read left-to-right.
- End-of-chapter references in Arabic chapters: finish the chapter with `\bibliographystyle{plainnat}` followed by `\chapterreferences` (defined in `preamble-ar.tex`). It prints the Arabic heading المراجع and sets the English entries left-to-right; a plain `\bibliography` would print a blank heading and reversed entries.
- If the local environment lacks `bidi.sty` or Arabic fonts, deliver the source and tell the author to compile on Overleaf with the XeLaTeX compiler (it has everything required) or a full TeX Live installation.
