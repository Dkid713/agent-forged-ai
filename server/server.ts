import cors from "cors";
import express from "express";
import type { Request, Response } from "express";
import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall
} from "openai/resources/chat/completions";

type Role = "system" | "user" | "assistant" | "tool";

interface ChatMessage {
  role: Role;
  content: string;
  name?: string;
  tool_call_id?: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  model?: string;
}

const PORT = Number(process.env.PORT ?? 5000);
const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn("[server] OPENAI_API_KEY is not set. Requests will fail until it is provided.");
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const toolDefinitions = [
  {
    type: "function" as const,
    function: {
      name: "get_server_time",
      description: "Get the current server time as an ISO string.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "echo_back",
      description: "Echo the provided text back to the user.",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "The text to echo back."
          }
        },
        required: ["text"],
        additionalProperties: false
      }
    }
  }
];

type ToolHandler = (args: Record<string, unknown>) => Promise<string>;

const toolHandlers: Record<string, ToolHandler> = {
  async get_server_time() {
    return new Date().toISOString();
  },
  async echo_back(args) {
    const text = typeof args.text === "string" ? args.text : undefined;
    if (!text) {
      throw new Error("Missing 'text' argument for echo_back tool");
    }
    return text;
  }
};

async function executeToolCall(toolCall: ChatCompletionMessageToolCall) {
  const handler = toolHandlers[toolCall.function.name];
  if (!handler) {
    return JSON.stringify({ error: `No handler implemented for ${toolCall.function.name}` });
  }

  try {
    const args = JSON.parse(toolCall.function.arguments ?? "{}");
    const result = await handler(args);
    return typeof result === "string" ? result : JSON.stringify(result);
  } catch (error) {
    console.error("[tool] Execution error:", error);
    return JSON.stringify({ error: (error as Error).message ?? "Unknown error" });
  }
}

async function runToolLoop(messages: ChatCompletionMessageParam[], model: string) {
  const conversation: ChatCompletionMessageParam[] = [...messages];

  for (let iteration = 0; iteration < 5; iteration += 1) {
    const response = await openai.chat.completions.create({
      model,
      messages: conversation,
      tools: toolDefinitions,
      tool_choice: "auto"
    });

    const choice = response.choices[0];
    if (!choice) {
      throw new Error("No choices returned from OpenAI");
    }

    const message = choice.message;
    const assistantMessage: ChatCompletionMessageParam = {
      role: "assistant",
      content: message.content ?? "",
      tool_calls: message.tool_calls
    };

    conversation.push(assistantMessage);

    if (message.tool_calls?.length) {
      for (const toolCall of message.tool_calls) {
        const output = await executeToolCall(toolCall);
        conversation.push({
          role: "tool",
          name: toolCall.function.name,
          tool_call_id: toolCall.id,
          content: output
        });
      }
      continue;
    }

    return {
      conversation,
      reply: message.content ?? ""
    };
  }

  throw new Error("Tool loop exceeded maximum iterations");
}

app.post("/api/chat", async (req: Request<unknown, unknown, ChatRequestBody>, res: Response) => {
  if (!Array.isArray(req.body?.messages)) {
    return res.status(400).json({ error: "'messages' array is required" });
  }

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "OPENAI_API_KEY is not configured on the server" });
  }

  const model = req.body.model ?? DEFAULT_MODEL;

  try {
    const initialMessages: ChatCompletionMessageParam[] = req.body.messages.map((message) => ({
      role: message.role,
      content: message.content,
      name: message.name,
      tool_call_id: message.tool_call_id
    }));

    const { conversation, reply } = await runToolLoop(initialMessages, model);

    return res.json({
      reply,
      messages: conversation
    });
  } catch (error) {
    console.error("[server] Error handling /api/chat:", error);
    const message = (error as Error).message ?? "Unknown server error";
    return res.status(500).json({ error: message });
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Agent server listening on http://localhost:${PORT}`);
});
