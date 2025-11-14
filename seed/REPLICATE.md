# CRUXAGI SEED SUPERVISED EVOLUTION PROTOCOL

This seed is intentionally **non-self-replicating**. All changes require human
supervision and remain confined to the local sandbox directory.

1. Review telemetry reports generated in `sandbox/approvals/`.
2. Inspect mutation proposals written to `sandbox/*.patch`.
3. Approve or reject proposals by setting `APPROVED_PROPOSAL_ID` and rerunning
   the organism.
4. Apply approved changes manually to production codebases after review.
5. Periodically reset the sandbox to ensure experiments stay isolated.

The organism never writes outside `sandbox/` and cannot spawn child processes
that persist beyond the supervised session.
