# agent-forged-ai

This repository provides utilities for working with external AI-related projects.

## Hybrid AGI Stack Overview

The current setup exposes a production-style hybrid stack on port `3001` that combines
language understanding with deterministic symbolic tooling. The architecture is
composed of three cooperating layers:

1. **LLM Orchestration (Athena Vi)** – Handles natural-language interaction, reasoning,
   contextual grounding, and chooses when to invoke external tools.
2. **Tool SDK (SymPy, Z3, Retriever)** – Provides exact mathematics, symbolic logic,
   constraint solving, and policy-checked retrieval to guarantee precision when the
   router escalates a request beyond pure language inference.
3. **Hybrid Router** – Dynamically routes between the LLM and symbolic tools, ensuring
   that operations demanding >95% precision are executed by deterministic backends
   while abstract or context-heavy tasks stay within the LLM loop.

With sandbox isolation, correct module discovery, and clean JSON responses, the stack
mirrors the production strategies used across tool-augmented LLM systems.

## Confirmed Capabilities

- **Integration** – Symbolic integration (e.g., `∫ x² dx`) returns exact forms such as
  `x**3/3` along with LaTeX rendering.
- **Factoring** – Polynomial factoring resolves into canonical factors (e.g.,
  `(x + 2) * (x + 3)`).
- **Equation Solving** – Non-linear roots are surfaced with exact sets (e.g.,
  `{2, 3}`) suitable for direct verification or downstream tool usage.

Execution logs demonstrate deterministic tool runs (typically 400–550 ms) with LLM
fallbacks disabled when symbolic certainty is required.

## Future Enhancements

- **Multi-line math execution** – Automatically split and execute pasted blocks of
  expressions with structured JSON results.
- **LaTeX rendering in the UI** – Integrate KaTeX or MathJax for higher fidelity math
  display.
- **Chain-of-tools pipelines** – Compose tool calls (e.g., integrate → solve →
  simplify) for end-to-end agent workflows.
- **Automated verification** – Validate symbolic answers via checks such as
  `simplify(actual - expected) == 0` before responding to users.
- **Mode toggles** – Provide `/math-mode` to force symbolic-first execution, or disable
  it to permit LLM-only reasoning when needed.

## Cloning the CRUX AGI AVI repository

If you want to clone [`Dkid713/cruxagi-avi-advanced-virtual-intelligence`](https://github.com/Dkid713/cruxagi-avi-advanced-virtual-intelligence), you can use the helper script provided in [`scripts/clone_cruxagi.sh`](scripts/clone_cruxagi.sh).

```bash
./scripts/clone_cruxagi.sh
```

The script defaults to cloning the repository into a local folder named `cruxagi-avi-advanced-virtual-intelligence`. You can override the destination or source URL:

```bash
./scripts/clone_cruxagi.sh <repo-url> <target-directory>
```

For example, to clone into `~/projects/cruxagi`:

```bash
./scripts/clone_cruxagi.sh https://github.com/Dkid713/cruxagi-avi-advanced-virtual-intelligence.git ~/projects/cruxagi
```

Make sure that `git` is installed on your system before running the script.
