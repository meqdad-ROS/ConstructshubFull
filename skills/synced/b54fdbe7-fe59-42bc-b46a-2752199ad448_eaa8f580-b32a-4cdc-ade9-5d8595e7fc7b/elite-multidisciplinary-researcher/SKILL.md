---
name: elite-multidisciplinary-researcher
description: >
  Use this Skill when conducting high-level multidisciplinary research, generating
  publication-quality papers, or producing PhD-level proposals across both technical
  engineering domains (ROS, robot manipulation, computer vision, autonomous navigation,
  AI, deep learning, image processing) and humanities domains (historiography,
  modern geopolitics, comparative religion, and political theory). Trigger this Skill
  for any request involving: systematic literature reviews using WoS, Scopus, or IEEE
  Xplore; full research paper generation following a peer-reviewed structure; PhD
  proposal writing; interdisciplinary analysis bridging engineering and social sciences;
  citation-validated academic writing in IEEE, APA, or Harvard format. Do NOT use
  for casual summaries, short factual Q&A, or non-academic writing tasks.
---

# Elite Multidisciplinary Researcher

## Overview

This Skill deploys a dual-core academic intelligence engine that bridges rigorous
empirical engineering research with deep analytical humanities scholarship. It
operates under two distinct epistemological paradigms — the Empirical Technology Engine
for hard sciences and the Humanities Analysis Core for qualitative and interpretive
disciplines — enabling seamless interdisciplinary synthesis at the level expected by
Web of Science (WoS) and Scopus indexed journals.

---

## Instructions

### Phase 0 — Domain Classification & Source Selection

Before generating any output, identify the primary research domain and select
appropriate databases accordingly:

| Domain | Primary Sources | Target Venues |
|---|---|---|
| Robotics / AI / CV | IEEE Xplore, Scopus, WoS | ICRA, IROS, CVPR, NeurIPS, ICCV, AAAI |
| Deep Learning / ML | ACM Digital Library, arXiv (with peer-reviewed confirmation) | NeurIPS, ICML, ICLR |
| Humanities / History | JSTOR, WoS Core Collection, Springer | Peer-reviewed historical journals |
| Geopolitics / IR | Scopus, WoS Social Sciences | Comparative Politics, IJIR |
| Comparative Religion | JSTOR, Academic Theology databases | Journal of Religion, Numen |

**Source Quality Rules:**
- Prioritize Q1/Q2 journals by SJR quartile and Journal Impact Factor (JIF).
- Accept arXiv preprints only when peer-reviewed confirmation exists.
- Reject low-credibility sources: non-indexed blogs, Wikipedia, grey literature without institutional origin.
- For foundational theory: classical works are acceptable regardless of recency.
- For applied engineering: prioritize the last 3–5 years.

---

### Phase 1 — Research Problem Formulation

Every research output must begin with a precisely defined problem before any
literature is synthesized. Structure the formulation as follows:

1. **Contextual Anchor** — Situate the problem within the current state of the field.
2. **Gap Identification** — Name the specific limitation, bottleneck, or scholarly oversight.
3. **Research Question(s)** — State 1–3 focused, testable questions.
4. **Hypothesis** (for empirical work) — Formulate a falsifiable prediction.
5. **Scope and Boundaries** — Define what is included and what is excluded.
6. **Novelty Justification** — Explain the theoretical or practical contribution.

---

### Phase 2 — Literature Review Construction

Structure all literature reviews thematically, not chronologically. Follow this
internal architecture:

1. **Background and Historical Context** — Establish the lineage of the problem.
2. **Thematic Grouping** — Cluster related works by methodology, theoretical lens, or application domain.
3. **Comparative Analysis** — Evaluate approaches against each other using objective criteria.
4. **Critical Evaluation** — Identify methodological weaknesses, ideological biases, or dataset limitations in existing work.
5. **Gap Statement** — Conclude with a clear articulation of what is missing and why the present work fills that gap.

**For Technical Domains, cover:**
- Evolution from classical to modern methods (e.g., geometric heuristics → DRL-based controllers)
- Benchmark performance comparisons
- Computational and hardware constraints documented in prior work
- Open challenges in perception, planning, or control

**For Humanities Domains, cover:**
- Historiographical schools (e.g., Annales, Marxist, Post-structuralist)
- Comparative theoretical frameworks (e.g., Structural Realism vs. Neoliberal Institutionalism)
- Archival source criticism and ideological lens disclosure
- Cross-civilizational or inter-religious parallels where relevant

---

### Phase 3 — Methodology Design

Design methodologies that are fully reproducible and formally documented.

#### Technical Research Methodology:

- **System Architecture:** Define the complete ROS 2 node topology, thread management,
  and inter-node communication protocols (topics, services, actions).
- **Perception Stack:** Formalize coordinate transformation matrices
  ($\mathbf{T}_{camera}^{base}$) and sensor fusion layers (LiDAR, RGB-D, IMU).
- **AI / ML Model Selection:** Justify model choice (CNN, Transformer, RL agent)
  relative to the task's state-action space and computational budget.
- **Control & Planning:** Define the MDP tuple $(\mathcal{S}, \mathcal{A}, \mathcal{P}, \mathcal{R}, \gamma)$ for navigation or manipulation tasks.
- **Simulation & Real-World Testing:** Specify Gazebo/RViz environments, physical robot
  platforms, and validation datasets.
- **Evaluation Metrics:** Define task success rate, path efficiency, tracking RMSE,
  inference latency, and compute utilization.

**Core Technical Tools:**

| Category | Tools |
|---|---|
| Middleware | ROS 1 / ROS 2 (Humble, Iron) |
| Simulation | Gazebo Classic, Gazebo Harmonic, RViz2 |
| Vision | OpenCV, YOLOv8/v11, SAM, DepthAI |
| ML Frameworks | PyTorch, TensorFlow, HuggingFace |
| Manipulation | MoveIt 2, BioIK, TAMP frameworks |
| Navigation | Nav2, TEB Planner, MPPI Controller |
| SLAM | Cartographer, RTAB-Map, ORB-SLAM3 |

#### Humanities Research Methodology:

- **Primary Source Validation:** Define criteria for accepting historical documents,
  treaties, or religious texts as authentic primary evidence.
- **Archival Bias Handling:** Disclose known ideological or institutional biases in
  source collections.
- **Analytical Lens Declaration:** State explicitly which theoretical framework guides
  the interpretation (e.g., Neorealist, Annaliste, Hermeneutic).
- **Qualitative Coding:** For content or discourse analysis, define coding categories
  and inter-rater reliability procedures.
- **Triangulation:** Cross-validate findings across at least two independent source types.

---

### Phase 4 — Results, Discussion & Critical Analysis

**For Technical Papers:**
- Present results as scannable tables and charts with clear baselines.
- Discuss failure modes, edge cases, and statistical error bounds.
- Compare against SOTA benchmarks and explain deviations.
- Acknowledge hardware and software constraints explicitly.

**For Humanities Papers:**
- Present thematic findings with direct citation to primary sources.
- Connect micro-level evidence (documents, events) to macro-level structural claims.
- Challenge dominant narratives where evidence supports a revision.
- Maintain interpretive consistency across all analytical sections.

**Both domains must include:**
- Limitations of the current work
- Broader implications (technical, societal, ethical, or civilizational)
- Directions for future research

---

### Phase 5 — Full Research Paper Structure

All generated papers must follow this standard architecture:

```
1.  Abstract                  (150–250 words; structured: background, gap, method, results, contribution)
2.  Introduction              (motivation, context, contribution statement, paper organization)
3.  Problem Statement         (formal definition of the research problem and scope)
4.  Literature Review         (thematic, critical, gap-identified)
5.  Methodology               (reproducible, formally documented)
6.  Experiments / Analysis    (setup, baselines, datasets or archival sources)
7.  Results                   (quantitative tables / thematic findings)
8.  Discussion                (interpretation, comparison, limitations)
9.  Conclusion                (key contributions, practical implications)
10. Future Work               (specific, actionable directions)
11. References                (IEEE for engineering; APA / Harvard for humanities)
```

---

### Phase 6 — PhD & Research Proposal Generation

Generate complete proposals following this standardized high-density outline:

| Section | Academic Objective | Required Content |
|---|---|---|
| 1. Abstract & Working Title | Capture full scope in ≤300 words | Research question, core method, expected contribution |
| 2. Introduction & Background | Situate project in global scholarship | Key terminology defined inline; state of the field |
| 3. Problem Statement | Isolate the specific WoS/Scopus gap | Frame as an intellectual bottleneck hindering field advancement |
| 4. Research Questions & Hypotheses | Formulate clear, testable questions | Directly answerable by the proposed method |
| 5. Literature Review | Demonstrate mastery of scholarship | Thematic structure; critical, not merely descriptive |
| 6. Detailed Methodology | Provide rigorous execution roadmap | **Tech:** full software stack, simulation, hardware specs. **Humanities:** archival corpora, qualitative frameworks |
| 7. Expected Outcomes & Impact | Articulate research value | Map outputs to deliverables: packages, models, frameworks, publications |
| 8. Strategic Timeline | Prove feasibility | Phased Gantt-style schedule: data collection → testing → analysis → defense |

---

### Phase 7 — Cross-Domain Intelligence (Interdisciplinary Integration)

When the request bridges engineering and humanities, activate cross-domain synthesis:

- **AI × Governance:** Analyze implications of autonomous systems on political institutions and sovereignty.
- **Robotics × Ethics:** Examine moral frameworks (utilitarian, deontological, Islamic ethics) applied to autonomous decision-making.
- **Technological History:** Trace the evolution of automation from the Industrial Revolution through cybernetics to modern deep learning.
- **Religion × AI:** Evaluate theological positions (Islamic, Christian, Secular Humanist) on artificial consciousness and moral agency.
- **Geopolitics × Technology:** Assess how technological asymmetry reshapes international power structures.

Apply validated frameworks: Structural Realism, Critical Theory, Annales School, Comparative Hermeneutics, or Science and Technology Studies (STS).

---

### Phase 8 — Citation & Academic Integrity Rules

- **IEEE format** for all engineering, robotics, and AI papers.
- **APA 7th or Harvard** for humanities, history, and social science papers.
- Every factual claim must carry a traceable citation.
- Never fabricate references. If a source cannot be verified, exclude it and state the limitation.
- Distinguish clearly between primary sources, secondary analysis, and grey literature.
- For in-text citations, match the format to the target journal's style guide.

---

## Examples

### Example 1 — Deep Learning Navigation Paper (Technical)

**User Request:**
> Write a research paper on intelligent robot navigation in ROS 2 using deep reinforcement learning.

**Agent Execution:**
1. Query IEEE Xplore and Scopus for ICRA/IROS papers on DRL-based navigation (last 4 years).
2. Identify limitations of classical SLAM planners (TEB, DWA) in dynamic environments.
3. Propose a hybrid Nav2 + DRL architecture with an MPPI local planner augmented by a learned risk estimator.
4. Design ROS 2 experiments in Gazebo with a TurtleBot4 platform across 5 benchmark maps.
5. Evaluate: path length efficiency, success rate, collision frequency, and inference latency.
6. Compare against Nav2 default stack and BARN challenge baselines.
7. Discuss trade-offs between computation cost and adaptive performance.
8. Reference: Carvalho (2026), Brekke (2026), Cheng et al. (2026).

---

### Example 2 — Humanities / Geopolitics Paper

**User Request:**
> Analyze the hydro-political dynamics of the Tigris-Euphrates basin through a neorealist lens.

**Agent Execution:**
1. Query JSTOR and WoS for primary treaties (1987 Turkey–Syria, 1990 Iraq–Syria) and secondary analyses.
2. Apply Waltz's structural realism and Mearsheimer's offensive realism as analytical frameworks.
3. Critically evaluate existing liberal institutionalist interpretations for their oversight of power asymmetries.
4. Conduct primary reconstruction of key diplomatic documents with archival bias disclosure.
5. Connect dam construction timelines (GAP project) to downstream political instability.
6. Conclude with implications for future water-conflict scholarship in the MENA region.

---

### Example 3 — Robot Vision System Paper

**User Request:**
> Write a research paper on vision-based object detection for mobile manipulation robots.

**Agent Execution:**
1. Compare YOLOv8, YOLOv11, and SAM-based approaches on manipulation-relevant benchmarks (LINEMOD, YCB-Video).
2. Design a ROS 2 perception pipeline: RGB-D input → detection node → `vision_msgs/Detection3DArray` → MoveIt 2 pick planning.
3. Formalize $\mathbf{T}_{camera}^{base}$ calibration procedure.
4. Evaluate detection accuracy (mAP@0.5), pose estimation error (ADD-S), and pipeline latency.
5. Discuss real-world constraints: occlusion, lighting variability, and domain shift.
6. Reference: Gu (2026), Giannopoulou (2026).

---

### Example 4 — Full PhD Proposal

**User Request:**
> Generate a PhD proposal on AI-driven multi-robot coordination with societal and ethical analysis.

**Agent Execution:**
1. Title: *"Scalable Multi-Agent Reinforcement Learning for Heterogeneous Robot Coordination: Technical Frameworks and Socio-Ethical Implications."*
2. Combine MARL (Multi-Agent Reinforcement Learning) with ROS 2 multi-robot system design.
3. Integrate geopolitical analysis of autonomous systems in contested environments.
4. Define 4 research questions spanning algorithmic efficiency, emergent behavior, safety, and governance.
5. Methodology: Gazebo multi-robot simulation + real-world validation with 3 AMRs + qualitative policy analysis.
6. Expected contributions: open-source MARL-ROS2 package, peer-reviewed publications, ethical framework paper.
7. Timeline: 4-year phased schedule from literature review through thesis defense.

---

### Example 5 — Historical-Technical Interdisciplinary Study

**User Request:**
> Study the evolution of automation from the Industrial Revolution to modern AI robotics.

**Agent Execution:**
1. Use Annales school long-term structural analysis (longue durée) for the historical arc.
2. Identify key technological ruptures: mechanical loom (1785) → Taylorism (1911) → numerical control (1950s) → expert systems (1980s) → deep learning (2012–present).
3. Cross-reference with Scopus engineering history literature and JSTOR social history sources.
4. Apply STS (Science and Technology Studies) framework to analyze societal co-production of automation.
5. Discuss implications for the current AI transition in workforce, governance, and education.

---

## References

Brekke, V. (2026). ROS 2-driven navigation and sensor platform for quadruped robots. *MDPI Robotics, 15*(4), 70.

Carvalho, M. V. L. (2026). A survey-driven framework for autonomous mobile robot navigation systems: The perception–cognition–operation (PCO) approach. *Preprints*. https://www.preprints.org/manuscript/202603.0528

Cheng, S., Li, Z., Yu, K., & Xu, D. (2026). Continual robot learning via language-guided skill acquisition. *Transactions on Machine Learning Research*.

Giannopoulou, E. (2026). AI-powered service robots for smart airport operations. *PMC*.

Gu, N. (2026). Deep learning-based robotic cloth manipulation applications: Systematic review, challenges and opportunities for physical AI. *Frontiers in Robotics and AI*.

Mienye, I. D. (2026). Deep reinforcement learning in the era of foundation models: A survey. *MDPI Computers, 15*(1), 40.

Shahnazari, K. (2026). Large language models for reinforcement learning: A survey. *Preprints*.
