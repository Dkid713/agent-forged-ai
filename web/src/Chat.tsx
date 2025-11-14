import { FormEvent, useCallback, useMemo, useState } from "react";
import axios from "axios";

type Role = "user" | "assistant" | "system" | "tool";

type ChatMessage = {
  role: Role;
  content: string;
  name?: string;
  tool_call_id?: string;
};

type ChatResponse = {
  reply: string;
  messages: ChatMessage[];
};

const defaultSystemPrompt: ChatMessage = {
  role: "system",
  content: "You are a helpful assistant that can call tools such as get_server_time when helpful."
};

const serverUrl = import.meta.env.VITE_SERVER_URL ?? "http://localhost:5000";

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([defaultSystemPrompt]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleMessages = useMemo(
    () => messages.filter((message) => message.role !== "tool"),
    [messages]
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!input.trim() || isLoading) {
        return;
      }

      const userMessage: ChatMessage = { role: "user", content: input.trim() };
      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setInput("");
      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.post<ChatResponse>(`${serverUrl}/api/chat`, {
          messages: nextMessages
        });
        setMessages(response.data.messages);
      } catch (err) {
        console.error("Failed to send message", err);
        setError(
          axios.isAxiosError(err)
            ? err.response?.data?.error ?? err.message
            : (err as Error).message
        );
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages]
  );

  const labelForRole = useCallback((role: Role, name?: string) => {
    switch (role) {
      case "assistant":
        return "Assistant";
      case "user":
        return "You";
      case "system":
        return "System";
      case "tool":
        return name ?? "Tool";
      default:
        return role;
    }
  }, []);

  return (
    <section className="chat-shell">
      <div className="chat-history">
        {visibleMessages.map((message, index) => (
          <article key={`${message.role}-${index}`} className={`message message-${message.role}`}>
            <header>{labelForRole(message.role, message.name)}</header>
            <p>{message.content}</p>
          </article>
        ))}
        {isLoading && <div className="message message-assistant">Assistant is thinking…</div>}
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Ask the assistant something…"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={isLoading}
          aria-label="Message"
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? "Sending…" : "Send"}
        </button>
      </form>

      {error && <div className="chat-error">{error}</div>}
    </section>
  );
}
