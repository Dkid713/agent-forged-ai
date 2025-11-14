# agent-forged-ai

This repository provides utilities for working with external AI-related projects.

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
