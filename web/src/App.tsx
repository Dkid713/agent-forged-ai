import { Chat } from "./Chat";
import "./App.css";

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Agent Chat</h1>
        <p>Talk with an agent backed by OpenAI and server-side tools.</p>
      </header>
      <main className="app-main">
        <Chat />
      </main>
    </div>
  );
}

export default App;
