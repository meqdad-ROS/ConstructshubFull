# Craft principles of great engineering authors

These are the habits that make classic engineering texts effective. They are distilled from how the most respected authors in robotics, control, circuits, mechanics, building services, and computing write — not from any single book. Apply them; do not imitate surface phrasing.

## Contents
1. Planning the arc of a book
2. Explaining a concept
3. Notation and mathematics
4. Figures, tables, and algorithms
5. Voice and prose
6. Common failure modes to avoid

## 1. Planning the arc of a book

- **Start from the reader's destination.** Write down what a reader can *do* after finishing the book (e.g. "design and tune a motion controller for a 6-DOF arm"). Every chapter must earn its place by moving toward that.
- **Dependency ordering.** Map the prerequisite relations between topics; chapters follow that order. State in the preface which chapters can be skipped or reordered for different courses ("A one-semester course may cover Chapters 1–7 and 10").
- **Spiral, not cliff.** Introduce a hard idea early in a simple form (planar, 1-D, linear) and return to it in full generality later.
- **Balanced chapters.** In a textbook, chapters should map to roughly 1–2 weeks of teaching; flag chapters that are too thick or thin.
- **A running example.** Strong texts carry one system (a two-link arm, a classroom's lighting zone, a DC motor) through many chapters so readers see how the pieces connect.
- **Front and back matter.** Preface (audience, prerequisites, course paths, what is distinctive), notation list, appendices for mathematical background, glossary, index terms.

## 2. Explaining a concept

Use this sequence; it is the single most important habit of strong authors:

1. **Why** — the engineering question that makes the concept necessary.
2. **Intuition** — a physical picture, analogy, or simple case the reader can visualise.
3. **Model** — the assumptions made explicit, then the mathematical form.
4. **Formal statement** — definition, theorem, or procedure, clearly set off.
5. **Check** — a limiting case, a units check, or a sanity example showing the result behaves sensibly.
6. **Use** — a worked example, then a note on where it breaks down in practice.

Other habits:
- Say what is coming ("In this section we derive… and then use it to…") and what has been achieved ("We have now shown that…"). Signposting orients the reader; it is not padding.
- Derivations show every non-obvious step and name the identity or assumption that justifies it.
- Pre-empt common misconceptions explicitly ("A frequent error is to…").
- Connect to real hardware, standards, and typical numbers — motor torques, illuminance levels, sensor noise figures — with sources where specific.

## 3. Notation and mathematics

- One notation table for the whole book, fixed before Chapter 1 is written. Never reuse a symbol for two meanings in one chapter; if a clash across chapters is unavoidable, state it.
- Define every symbol at first use in each chapter, with units.
- Number only equations referred to later; refer with `\eqref`.
- Set off important results (box or theorem environment) so they are easy to find on a reread.
- Show units at every line where values are substituted in worked examples.

## 4. Figures, tables, and algorithms

- Every figure has a job; the caption states the takeaway, not just the subject ("Joint torque rises sharply near singular configurations", not "Joint torque plot").
- Every figure and table is referred to in the text before it appears.
- Use pseudocode (`algorithm2e`) for procedures; real code listings (`listings`) only when language details matter.
- When final artwork cannot be produced, insert a precise figure brief (what is shown, axes, labels, the message) so an illustrator or TikZ author can produce it. Simple diagrams and plots can be drawn directly in TikZ/pgfplots.

## 5. Voice and prose

- Precise, calm, and confident. Prefer the active voice and concrete verbs. Short sentences for definitions; longer ones for reasoning.
- Textbook "we" includes the reader; avoid "obviously", "trivially", "it is easy to see".
- Avoid the generic rhythm of machine-written text: stacked triplets of adjectives, empty intensifiers, openings such as "In today's rapidly evolving world", and paragraphs that restate the heading.
- Brief, accurate historical and contextual remarks make a book memorable — cite them.
- One idea per paragraph, opening with a topic sentence.

## 6. Common failure modes to avoid

- A wall of definitions before any motivation.
- Worked examples that only substitute numbers without reasoning.
- Problems that repeat the examples with new numbers only.
- Undefined symbols, inconsistent units, or notation drift between chapters.
- Invented citations or confident claims about standards without edition and clause.
- A chapter without its own References list, or a list padded with websites and brochures instead of books and peer-reviewed papers.
- Chapters that summarise the literature instead of teaching.
