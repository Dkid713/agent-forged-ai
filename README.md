# agent-forged-ai

This repository provides utilities for working with external AI-related projects.

## Running the Athena Chat Module

The production-ready Athena Chat module lives in the subdirectory
`CRUXAGI_COMPRESSION_V2/athena-chat`. To run it from the root of this
repository:

```bash
cd CRUXAGI_COMPRESSION_V2/athena-chat
npm install   # only required the first time
npm run dev   # starts the chat HTTP server on port 5000
```

To start the AGI worker for the module, run:

```bash
cd CRUXAGI_COMPRESSION_V2/athena-chat
npm run agi
```

If you prefer a single command that handles dependency installation and starts
the server, use the helper script from the project root:

```bash
./start-athena-chat.sh
```

### Verifying the server

Once the server is running you can confirm it is healthy with:

```bash
curl http://localhost:5000/health
```

Expected output:

```
{"status":"ok"}
```

If the command returns `No response on port 5000` or similar, the server is not
running.

## Fixing the tsx IPC error

Both the main Athena app and the standalone module use `tsx` to execute
TypeScript entrypoints. In restricted environments (such as Replit) `tsx` may
fail with an error like:

```
Error: listen UNKNOWN: unknown error /tmp/tsx-1000/15278.pipe
```

Add the environment variable `TSX_DISABLE_IPC=1` to the relevant npm scripts to
disable the IPC feature and prevent the crash. Example for the main app's
`package.json`:

```json
"scripts": {
  "dev": "NODE_ENV=development TSX_DISABLE_IPC=1 tsx server/index.ts"
}
```

The Athena Chat module already includes this flag in its scripts.

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
