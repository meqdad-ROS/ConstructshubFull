# Worked examples and end-of-chapter problems

Worked examples and problems are where readers actually learn. Great authors treat them as carefully designed teaching instruments, not decoration.

## Worked examples

Each worked example models how an expert thinks, so show the thinking, not just the arithmetic. Use this structure (the `example` environment in the template provides the frame):

1. **Problem statement** — realistic context, given data with units, and exactly what is asked.
2. **Approach / strategy** — one or two sentences on which principle applies and why; what is assumed.
3. **Solution** — step by step, each step justified; units carried through; intermediate values with sensible significant figures.
4. **Check** — units, order of magnitude, limiting case, or an independent method.
5. **Discussion** — what the result means physically or for design, and what would change if an assumption failed.

Guidelines:
- Place each example immediately after the concept it exercises.
- Progress within a chapter: first example isolates one idea; later examples combine ideas; the last is often a small design problem.
- Use realistic numbers (real motor ratings, realistic room dimensions, plausible sensor noise). Cite data sheets or standards when a number is specific.
- **Verify every number.** Recompute the solution independently (Python is ideal) before presenting it — including numbers quoted in the Check and Discussion paragraphs and in the surrounding prose (distances, percentages, comparisons), which are the ones most often written from memory and most often wrong. An arithmetic error in a worked example damages a book's credibility more than almost anything else.

## End-of-chapter problems

Organise by section and difficulty. A reliable scheme:

| Level | Mark | Purpose |
|---|---|---|
| Basic | (none) | Direct application of one concept; confidence building |
| Intermediate | $\ast$ | Several concepts combined; some judgement required |
| Advanced | $\ast\ast$ | Derivations, generalisation, non-routine reasoning |
| Design / project | D | Open-ended, multiple valid answers, real constraints |
| Computational | C | Requires MATLAB/Python/simulation |

Design principles:
- Every learning objective of the chapter is exercised by at least one problem.
- Include conceptual questions ("Explain why…", "What happens if…") as well as numerical ones.
- Avoid problems that merely change numbers in a worked example; change the unknown, reverse the question, or add a constraint instead.
- Include a few problems that reuse the book's running example.
- Supply answers to odd-numbered (or selected) problems in an appendix; full solutions go in a separate instructor's solutions manual, written to the same standard as worked examples.

## Solutions manual

When asked for solutions: full worked solutions in the worked-example format, with alternative methods noted, common student errors flagged, and marking guidance for open-ended problems. Verify all numerical answers computationally.
