# Agent Forged AI

This repository now hosts a minimal full-stack agent chat application.

## Project structure

- `server/`: Express + TypeScript backend that connects to OpenAI's Chat Completions API and executes simple server tools.
- `web/`: Vite + React TypeScript frontend that talks to the backend and renders a lightweight chat UI.

## Getting started

### Backend

```bash
cd server
npm install
cp .env.example .env # or create manually
npm run dev
```

Create a `.env` file inside the `server` directory with at least:

```
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4o-mini
PORT=5000
```

### Frontend

```bash
cd web
npm install
npm run dev
```

The frontend runs on [http://localhost:5173](http://localhost:5173) by default and expects the backend at `http://localhost:5000`.

## Tooling

- The backend exposes two demo tools (`get_server_time` and `echo_back`) to showcase tool calling.
- The frontend provides a basic but styled chat interface with message history.

## Scripts

Each package includes conventional `dev`, `build`, and `start`/`preview` scripts. Refer to the respective `package.json` for more details.

## Next steps

- Integrate additional Codex compression logic from the `codex/*` branches.
- Expand the tool set and improve error handling as needed.
