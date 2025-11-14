import { Chat } from "./Chat";

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Agent Chat</h1>
        <p className="subtitle">Full-stack demo with OpenAI tool calling</p>
      </header>
      <main className="app-main">
        <Chat />
      </main>
      <footer className="app-footer">
        <small>
          Configure <code>OPENAI_API_KEY</code> in <code>server/.env</code> and run both the server
          and web apps locally.
        </small>
      </footer>
    </div>
  );
}

export default App;
