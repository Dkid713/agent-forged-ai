# agent-forged-ai

This repository provides utilities for working with external AI-related projects.

## Autonomous AGI microservice

The `autonomous-server` service exposes an HTTP API on port `3000` that allows an OpenAI model to observe and act on this repository. It supports reading and writing files, running shell commands, managing git branches, and opening GitHub pull requests.

### Requirements

Set the following environment variables before starting the service:

- `OPENAI_API_KEY`
- `GITHUB_TOKEN`
- `GITHUB_OWNER`
- `GITHUB_REPO`
- `AUTONOMOUS_AGI_PORT` (optional, defaults to `3000`)

### Install dependencies

```bash
npm install
```

### Start the service in development

```bash
npm run dev
```

### Build and run in production

```bash
npm run build
npm start
```

### Chat endpoint

Send a POST request to `http://localhost:3000/chat` with a JSON payload:

```json
{
  "messages": [
    { "role": "system", "content": "You are a helpful code assistant." },
    { "role": "user", "content": "Inspect the repository." }
  ]
}
```

The service will loop on OpenAI function-calls until the model returns a final assistant message.

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
