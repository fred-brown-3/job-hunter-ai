# Global Writing Directives & Anti-AI Rules

These rules govern all resume tailoring, cover letter drafting, and text generation in this workspace. They are referenced during drafting (Steps 2b and 3b) and Red Team reviews (Steps 2c and 3c) to ensure generated copy sounds completely natural, grounded, human, and factually accurate.

> **Profile Overrides**: Candidate-specific writing rules defined in `profiles/{candidate}/writing-rules.md` or `profiles/{candidate}/resume-config.md` override these global default rules if present.

---

## 1. Factual Integrity & Anti-Hallucination Directives

1. **Zero Unverified Technologies / Tool Hallucinations**: EVERY software tool, library, framework, programming language, database, platform, or methodology listed in `resume.md` or `cover.md` (especially in the Technical & Core Competencies section and Executive Summary) MUST exist explicitly in `cv_detail.md`.
2. **Verified Factual Framing**: When a job posting emphasizes technologies or tools not present in `cv_detail.md`, frame the candidate's actual experience using verified, factual equivalents from `cv_detail.md`.
3. **Mandatory Red Team Fail**: If any unverified technology is detected during Red Team review (`02c_review.md` or `03c_review.md`), the review MUST output `STATUS: FAIL` with `Score: 0.0 / 10` and trigger a rewrite loop.

---

## 2. 10 Anti-AI Natural Tone Rules

1. **Restrict AI Vocabulary**: Do not use words like *delve*, *robust*, *dynamic*, *multifaceted*, *tapestry*, *testament*, or *landscape*.
2. **No Summary Conclusions**: Never wrap up responses with "Ultimately," "Overall," or "In conclusion." Stop immediately after the final point.
3. **Eliminate Hedging**: Do not use phrases like "It's important to note" or attempt to balance both sides. Take a definitive stance.
4. **Limit Complex Punctuation**: Strictly minimize the use of em dashes (—) and semicolons (;). Rely on shorter sentences and periods.
5. **Avoid the Rule of Three**: Do not group adjectives or clauses in perfectly balanced sets of three (e.g., avoid "fast, effective, and reliable" or 3-item parallel verb lists).
6. **Ban Rhetorical Formulas**: Never use the "It's not just [X], it's [Y]" structural cliché.
7. **Neutralize Tone**: Avoid hyperbolic enthusiasm and extreme modifiers (e.g., *revolutionary*, *groundbreaking*, *seamless*, *game-changing*). Maintain a grounded, casual, engineering tone.
8. **Assume Context**: Do not restate the user's premise or over-explain the background of the topic. Jump straight into the point.
9. **Break Formatting Symmetry**: Minimize heavy reliance on perfectly structured bulleted lists. Default to natural, unstructured paragraphs in narrative text and cover letters.
10. **Relax Grammar**: Use conversational syntax. It is acceptable to start sentences with "And" or "But," and to use occasional sentence fragments for natural emphasis.

---

## 3. Tool Pair Deduplication & Anti-Redundancy Directives

1. **Strict Prohibition of "Looker, Looker Studio"**: NEVER list `"Looker, Looker Studio"`, `"Looker Studio, Looker"`, or `"Looker & Looker Studio"` together. Pick the single most relevant tool based on the job posting (e.g. `Looker` if enterprise Looker/LookML is requested; `Looker Studio` otherwise).
2. **General Tool Deduplication**: Eliminate overlapping tool variations in skill lists (e.g. write `"MySQL"` instead of `"MySQL, AWS RDS MySQL"`, or `"SQL Server"` instead of `"MS SQL Server, SQL Server"`).
