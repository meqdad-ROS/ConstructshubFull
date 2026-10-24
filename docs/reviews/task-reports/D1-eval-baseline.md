# D1 — AI evaluation harness: baseline report

> **Task:** D1-A (Playbook §D1-A).
> **Branch:** `task-d1-eval-harness`.
> **Scope:** repeatable eval harness + today's-services baseline. Full
> write-up and run commands below; the full-run report mirror follows.

## Suggested PROGRESS.md status line

> Delete this block before merging to `main` — this is the proposed line for
> the integration owner to paste into the status table, not an edit to the
> file.

```
| **🧪 AI evaluation (§D1)** | 100 | **D1-A done 2026-10-24** on `task-d1-eval-harness`. Repeatable, stdlib-only Python harness at `ai/evals/` scoring three tracks: detection (per-class P/R/F1 + image-level accuracy, greedy IoU match), OCR (CER + WER with Unicode NFKC normalisation, Arabic-Indic → ASCII digit folding, tashkeel stripping) and BIM (per-line quantity error % + line coverage with case-folded (ifc_class,unit) matching). Datasets: 65 synthetic placards + 6 staged real-world photos (plan documented); 32 synthetic rendered documents (English/Arabic/Arabic+English/Arabic-Indic digits/calligraphic Arabic) + 5 staged real documents; 5 ISO-10303-21 STEP fixtures. 50-test suite covering toy cases, Arabic Unicode, empty predictions, zero-truth, path traversal, bad manifests. CI gate at `.github/workflows/ai-evals.yml` (path-filtered to AI service changes) runs harness unit tests + a deterministic 10-sample smoke across all three tracks. Baseline: OCR mean CER 11.51%, WER 20.01% (today's tesseract.js via Node runner, same model as `/api/search/ocr`); BIM 0.00% error (in-tree STEP parser matches `lib/bsdd.ts::parseIfc`); detection offline-zero baseline until Next.js stack is running (SRS caveat recorded in the report). | `ai/evals/`, `.github/workflows/ai-evals.yml`, `docs/reviews/task-reports/D1-eval-baseline.md` | Acceptance gate for D2–D5 is live. |
```

## How to reproduce this baseline

```bash
# Deterministic — same bytes in, same scores out.
cd /home/meqdad/My-Projects/Construct-Hub_Project
python -m unittest discover ai/evals/tests           # 50 tests, ~5s
OCR_PROVIDER=js python -m ai.evals.runner             # full baseline
python -m ai.evals.runner --smoke                     # 10-sample smoke
```

The OCR track runs the same `tesseract.js` model the shipping
`/api/search/ocr` route uses, so "today's service" numbers below are the
numbers the Next.js endpoint would produce on the same inputs. See
`ai/evals/README.md` for the full invocation surface + the staged-acquisition
plan for licensed real-world imagery and handwritten specimens.

## Evidence — commands + output

```text
$ python3 -m unittest discover ai/evals/tests
Ran 50 tests in 5.303s
OK

$ OCR_PROVIDER=js python3 -m ai.evals.runner --out ai/evals/reports/baseline-2026-10-24.md
[runner] wrote ai/evals/reports/baseline-2026-10-24.md
```

Full report follows — mirrored verbatim from
`ai/evals/reports/baseline-2026-10-24.md`.

---

# ConstructsHub — AI evaluation report

- **Generated:** 2026-10-24 02:38:27Z
- **Harness version:** `0.1.0`
- **Repo revision:** `d6aa1b141c9b433239cf9ab08c1bf8e62a898aaa`

## Detection — construction-material imagery

- **Dataset:** `constructshub-detection-v1` v`2026.10.24` (65 included, 6 skipped)
- **Service:** image-search (offline-zero)
- **IoU threshold:** 0.5  |  **Score threshold:** 0.0

### Overall

| metric | value |
| --- | --- |
| precision | 0.00% |
| recall | 0.00% |
| F1 | 0.00% |
| image-level accuracy | 0.00% |
| TP / FP / FN | 0 / 0 / 80 |
| num images | 65 |

### Per class

| class | TP | FP | FN | precision | recall | F1 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `Construction Materials` | 0 | 0 | 14 | 0.00% | 0.00% | 0.00% |
| `Electrical Materials` | 0 | 0 | 13 | 0.00% | 0.00% | 0.00% |
| `HVAC` | 0 | 0 | 12 | 0.00% | 0.00% | 0.00% |
| `Heavy Equipment` | 0 | 0 | 13 | 0.00% | 0.00% | 0.00% |
| `Plumbing Materials` | 0 | 0 | 13 | 0.00% | 0.00% | 0.00% |
| `Structural Materials` | 0 | 0 | 15 | 0.00% | 0.00% | 0.00% |

## OCR — document scans & handwritten Arabic

- **Dataset:** `constructshub-ocr-v1` v`2026.10.24` (32 included, 5 skipped)
- **Service:** ocr (tesseract-js)
- **Normalisation:** fold Arabic-Indic digits = `True`, strip diacritics = `True`

### Overall

| metric | value |
| --- | --- |
| mean CER | 11.51% |
| mean WER | 20.01% |
| num samples | 32 |
| num scored | 32 |
| num with empty truth | 0 |
| num with empty prediction | 1 |

### Per sample (first 30 rows)

| sample | CER | WER | notes |
| --- | ---: | ---: | --- |
| `ocr-001-en` | 0.00% | 0.00% |  |
| `ocr-002-en` | 0.00% | 0.00% |  |
| `ocr-003-en` | 0.00% | 0.00% |  |
| `ocr-004-en` | 0.00% | 0.00% |  |
| `ocr-005-en` | 0.00% | 0.00% |  |
| `ocr-006-en` | 0.00% | 0.00% |  |
| `ocr-007-en` | 17.50% | 33.33% |  |
| `ocr-008-en` | 5.71% | 16.67% |  |
| `ocr-009-en` | 0.00% | 0.00% |  |
| `ocr-010-en` | 0.00% | 0.00% |  |
| `ocr-011-en` | 0.00% | 0.00% |  |
| `ocr-012-en` | 0.00% | 0.00% |  |
| `ocr-013-ar` | 0.00% | 0.00% |  |
| `ocr-014-ar` | 4.35% | 20.00% |  |
| `ocr-015-ar` | 4.00% | 16.67% |  |
| `ocr-016-ar` | 0.00% | 0.00% |  |
| `ocr-017-ar` | 34.38% | 87.50% |  |
| `ocr-018-ar` | 0.00% | 0.00% |  |
| `ocr-019-ar` | 2.86% | 12.50% |  |
| `ocr-020-ar+en` | 9.80% | 20.00% |  |
| `ocr-021-ar+en` | 38.24% | 60.00% |  |
| `ocr-022-ar+en` | 8.00% | 37.50% |  |
| `ocr-023-ar-digits` | 20.00% | 28.57% |  |
| `ocr-024-ar-digits` | 20.83% | 16.67% |  |
| `ocr-025-ar-digits` | 25.93% | 33.33% |  |
| `ocr-026-en` | 17.39% | 37.50% |  |
| `ocr-027-en` | 13.95% | 25.00% |  |
| `ocr-028-ar-handwritten` | 100.00% | 100.00% | empty prediction |
| `ocr-029-ar-handwritten` | 37.50% | 66.67% |  |
| `ocr-030-ar-handwritten` | 0.00% | 0.00% |  |
| … | | | *2 more rows truncated* |

## BIM — IFC quantity extraction

- **Dataset:** `constructshub-bim-v1` v`2026.10.24` (5 included, 0 skipped)
- **Service:** bim (local-step)
- **Tolerance:** 5.0% of truth quantity

### Overall

| metric | value |
| --- | --- |
| mean quantity error | 0% |
| num truth lines | 20 |
| num predicted lines | 20 |
| matched / missed / extra | 20 / 0 / 0 |
| within tolerance | 20 |

### Line items

| IFC class | unit | truth | prediction | abs err | pct err | status |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| `bim-001-small-wall-slab::IFCDOOR` | count | 3.00 | 3.00 | 0 | 0% | matched |
| `bim-001-small-wall-slab::IFCSLAB` | count | 2.00 | 2.00 | 0 | 0% | matched |
| `bim-001-small-wall-slab::IFCWALL` | count | 4.00 | 4.00 | 0 | 0% | matched |
| `bim-001-small-wall-slab::IFCWINDOW` | count | 5.00 | 5.00 | 0 | 0% | matched |
| `bim-002-beam-column-grid::IFCBEAM` | count | 12.00 | 12.00 | 0 | 0% | matched |
| `bim-002-beam-column-grid::IFCCOLUMN` | count | 9.00 | 9.00 | 0 | 0% | matched |
| `bim-002-beam-column-grid::IFCSLAB` | count | 1.00 | 1.00 | 0 | 0% | matched |
| `bim-003-piping-run::IFCFLOWSEGMENT` | count | 20.00 | 20.00 | 0 | 0% | matched |
| `bim-003-piping-run::IFCPIPEFITTING` | count | 7.00 | 7.00 | 0 | 0% | matched |
| `bim-003-piping-run::IFCVALVE` | count | 4.00 | 4.00 | 0 | 0% | matched |
| `bim-004-electrical-panel::IFCCABLECARRIERSEGMENT` | count | 8.00 | 8.00 | 0 | 0% | matched |
| `bim-004-electrical-panel::IFCCABLESEGMENT` | count | 24.00 | 24.00 | 0 | 0% | matched |
| `bim-004-electrical-panel::IFCELECTRICDISTRIBUTIONBOARD` | count | 1.00 | 1.00 | 0 | 0% | matched |
| `bim-005-mixed-storey::IFCBEAM` | count | 6.00 | 6.00 | 0 | 0% | matched |
| `bim-005-mixed-storey::IFCCOLUMN` | count | 4.00 | 4.00 | 0 | 0% | matched |
| `bim-005-mixed-storey::IFCDOOR` | count | 2.00 | 2.00 | 0 | 0% | matched |
| `bim-005-mixed-storey::IFCSLAB` | count | 2.00 | 2.00 | 0 | 0% | matched |
| `bim-005-mixed-storey::IFCSTAIR` | count | 1.00 | 1.00 | 0 | 0% | matched |
| `bim-005-mixed-storey::IFCWALL` | count | 6.00 | 6.00 | 0 | 0% | matched |
| `bim-005-mixed-storey::IFCWINDOW` | count | 4.00 | 4.00 | 0 | 0% | matched |

## Caveats

- Services called via `urllib` only (no new deps). Where a service was unreachable, the sample counts against recall rather than being dropped — the per-sample row flags it.
- The detection track scores *mapped class behavior*; today's image-search endpoint returns OCR word boxes (`detectorKind: 'ocr-words'`), so a word box matches a truth box only when the ontology maps the word to the truth class. The report labels this plainly rather than relabelling word boxes as object detections.
