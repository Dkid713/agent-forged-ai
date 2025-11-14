# Agent Forged AI

A minimal full-stack starter for building chat-based agent experiences with an Express + OpenAI backend and a Vite React frontend.

## Features

- **Server** (`server/`)
  - Express API with a `/api/chat` endpoint
  - OpenAI Chat Completions integration with a simple tool-calling loop
  - Built-in demo tools: `get_server_time` and `echo_back`
- **Web** (`web/`)
  - React chat interface styled for dark mode
  - Axios-based client that talks to the Express backend
  - Filters tool messages out of the visible transcript

## Getting started

### Prerequisites

- Node.js 18+
- An OpenAI API key with access to the configured model (defaults to `gpt-4o-mini`)

### 1. Configure environment variables

Copy the example environment file and update it with your OpenAI credentials:

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and set `OPENAI_API_KEY`. You can also adjust `OPENAI_MODEL` and `PORT` if needed.

### 2. Install dependencies

Run the following commands from the repository root:

```bash
(cd server && npm install)
(cd web && npm install)
```

> **Note:** If package installation is blocked in your environment, ensure you have network access to `https://registry.npmjs.org/` or mirror the listed dependencies manually.

### 3. Start the development servers

In two terminals:

```bash
# Terminal A: backend
cd server
npm run dev

# Terminal B: frontend
cd web
npm run dev
```

The React app will be available at http://localhost:5173 and will proxy chat requests to the Express backend at http://localhost:5000.

### 4. Try it out

Open the web app, send a message, and try asking something like "What time is it?" to trigger the `get_server_time` tool.

## Project structure

```
.
├── server
│   ├── server.ts
│   ├── package.json
│   └── tsconfig.json
├── web
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── .gitignore
└── README.md
```

## Next steps

- Add authentication or rate limiting before deploying publicly.
- Expand the tool set to integrate with your data sources or services.
- Containerize the server for production environments.
- Consolidate any useful experimental branches into `main`.
