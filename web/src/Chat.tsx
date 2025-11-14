import { useState, type KeyboardEvent } from "react";
import axios from "axios";

type Message = {
  role: "user" | "assistant" | string;
  content: string;
};

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || pending) {
      return;
    }

    const userMessage: Message = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setPending(true);

    try {
      const response = await axios.post("http://localhost:5000/api/chat", {
        messages: nextMessages,
      });
      const assistantReply: Message = {
        role: "assistant",
        content: response.data.reply ?? "",
      };
      setMessages((prev) => [...prev, assistantReply]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong.",
        },
      ]);
      console.error(error);
    } finally {
      setPending(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`chat-message chat-message-${message.role}`}>
            <strong className="chat-role">{message.role}:</strong>
            <span className="chat-content">{message.content}</span>
          </div>
        ))}
        {pending ? (
          <div className="chat-message chat-message-assistant">
            <strong className="chat-role">assistant:</strong>
            <span className="chat-content">Thinking…</span>
          </div>
        ) : null}
      </div>
      <div className="chat-input-row">
        <input
          className="chat-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the agent something"
          disabled={pending}
        />
        <button className="chat-send" type="button" onClick={() => void send()} disabled={pending}>
          {pending ? "Sending" : "Send"}
        </button>
      </div>
    </div>
  );
}
