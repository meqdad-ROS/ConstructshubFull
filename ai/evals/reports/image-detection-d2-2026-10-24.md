# ConstructsHub — image search detector before/after

- **Generated:** 2026-10-24T05:54:04.008Z
- **Dataset:** detection manifest, 65 included samples
- **IoU threshold:** 0.5  |  Metric policy: 
  mirrors ai/evals/harness/metrics.py (greedy match, label swap = 2 mistakes).

## Pipeline: `ocr-words`

### Overall

| metric | value |
| --- | --- |
| precision | 0.00% |
| recall | 0.00% |
| F1 | 0.00% |
| image-level accuracy | 0.00% |
| TP / FP / FN | 0 / 46 / 80 |
| num images | 65 |
| latency P95 | 1284 ms |

#### Per class

| class | TP | FP | FN | precision | recall | F1 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `Structural Materials` | 0 | 8 | 15 | 0.00% | 0.00% | 0.00% |
| `Construction Materials` | 0 | 8 | 14 | 0.00% | 0.00% | 0.00% |
| `Electrical Materials` | 0 | 8 | 13 | 0.00% | 0.00% | 0.00% |
| `Plumbing Materials` | 0 | 9 | 13 | 0.00% | 0.00% | 0.00% |
| `HVAC` | 0 | 6 | 12 | 0.00% | 0.00% | 0.00% |
| `Heavy Equipment` | 0 | 7 | 13 | 0.00% | 0.00% | 0.00% |

## Pipeline: `classical-cv`

### Overall

| metric | value |
| --- | --- |
| precision | 100.00% |
| recall | 62.50% |
| F1 | 76.92% |
| image-level accuracy | 70.77% |
| TP / FP / FN | 50 / 0 / 30 |
| num images | 65 |
| latency P95 | 56 ms |

#### Per class

| class | TP | FP | FN | precision | recall | F1 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `Structural Materials` | 8 | 0 | 7 | 100.00% | 53.33% | 69.57% |
| `Construction Materials` | 9 | 0 | 5 | 100.00% | 64.29% | 78.26% |
| `Electrical Materials` | 8 | 0 | 5 | 100.00% | 61.54% | 76.19% |
| `Plumbing Materials` | 11 | 0 | 2 | 100.00% | 84.62% | 91.67% |
| `HVAC` | 7 | 0 | 5 | 100.00% | 58.33% | 73.68% |
| `Heavy Equipment` | 7 | 0 | 6 | 100.00% | 53.85% | 70.00% |

## Pipeline: `object-detection`

### Overall

| metric | value |
| --- | --- |
| precision | 10.53% |
| recall | 2.50% |
| F1 | 4.04% |
| image-level accuracy | 3.08% |
| TP / FP / FN | 2 / 17 / 78 |
| num images | 65 |
| latency P95 | 4272 ms |

#### Per class

| class | TP | FP | FN | precision | recall | F1 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `Structural Materials` | 0 | 0 | 15 | 0.00% | 0.00% | 0.00% |
| `Construction Materials` | 0 | 0 | 14 | 0.00% | 0.00% | 0.00% |
| `Electrical Materials` | 2 | 17 | 11 | 10.53% | 15.38% | 12.50% |
| `Plumbing Materials` | 0 | 0 | 13 | 0.00% | 0.00% | 0.00% |
| `HVAC` | 0 | 0 | 12 | 0.00% | 0.00% | 0.00% |
| `Heavy Equipment` | 0 | 0 | 13 | 0.00% | 0.00% | 0.00% |

## Verdict

Before (`ocr-words`) → After (`classical-cv`, best-F1 of the shipped detectors):

| metric | before | after | delta |
| --- | ---: | ---: | ---: |
| precision | 0.00% | 100.00% | 100.00% |
| recall | 0.00% | 62.50% | 62.50% |
| F1 | 0.00% | 76.92% | 76.92% |
| image accuracy | 0.00% | 70.77% | 70.77% |

### All detectors, side-by-side

| pipeline | precision | recall | F1 | image acc | latency P95 |
| --- | ---: | ---: | ---: | ---: | ---: |
| `ocr-words` | 0.00% | 0.00% | 0.00% | 0.00% | 1284 ms |
| `classical-cv` | 100.00% | 62.50% | 76.92% | 70.77% | 56 ms |
| `object-detection` | 10.53% | 2.50% | 4.04% | 3.08% | 4272 ms |

## Caveats

- The `ocr-words` row is the pre-D2 behaviour, reimplemented inline so
  the "before" numbers are reproducible from a single run of this
  script. It is NOT a re-run of the shipped lib/search/image.ts (the
  shipped file has been replaced in this task).
- Latency is wall-clock per-image including OCR + detector + I/O. P95
  is the SRS NFR-PER budget (≤ 4000 ms for image search).
