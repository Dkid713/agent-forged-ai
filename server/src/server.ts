import express from "express";
import cors from "cors";
import { OpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn("OPENAI_API_KEY is not set. Requests to /api/chat will fail until it is provided.");
}

const openai = apiKey ? new OpenAI({ apiKey }) : null;

const tools = [
  {
    type: "function" as const,
    function: {
      name: "get_server_time",
      description: "Get the current server time in ISO format",
      parameters: {
        type: "object",
        properties: {},
        required: [] as string[],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "echo_back",
      description: "Echo back the provided string",
      parameters: {
        type: "object",
        properties: {
          echo: {
            type: "string",
            description: "The string to echo back",
          },
        },
        required: ["echo"],
      },
    },
  },
];

type ToolName = "get_server_time" | "echo_back";

type ToolArgs = {
  get_server_time: Record<string, never>;
  echo_back: { echo: string };
};

function executeTool<TName extends ToolName>(name: TName, args: ToolArgs[TName]) {
  switch (name) {
    case "get_server_time":
      return new Date().toISOString();
    case "echo_back":
      return (args as ToolArgs["echo_back"]).echo;
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

app.post("/api/chat", async (req, res) => {
  if (!openai) {
    res.status(500).json({ error: "OPENAI_API_KEY is not configured on the server." });
    return;
  }

  const { messages = [], model = process.env.OPENAI_MODEL } = req.body ?? {};

  if (!Array.isArray(messages)) {
    res.status(400).json({ error: "messages must be an array" });
    return;
  }

  const conversation = [
    { role: "system", content: "You are a helpful agent. Use tools when needed." },
    ...messages,
  ];

  try {
    const MAX_STEPS = 10;
    for (let step = 0; step < MAX_STEPS; step += 1) {
      const response = await openai.chat.completions.create({
        model: model ?? "gpt-4o-mini",
        messages: conversation,
        tools,
        tool_choice: "auto",
      });

      const message = response.choices[0]?.message;
      if (!message) {
        res.status(500).json({ error: "No response from model" });
        return;
      }

      conversation.push(message);

      if (!message.tool_calls?.length) {
        res.json({ reply: message.content ?? "" });
        return;
      }

      for (const toolCall of message.tool_calls) {
        if (!toolCall.function) {
          continue;
        }

        const { name, arguments: rawArgs } = toolCall.function;

        try {
          const parsedArgs = rawArgs ? JSON.parse(rawArgs) : {};
          const toolResult = executeTool(name as ToolName, parsedArgs as ToolArgs[ToolName]);
          conversation.push({
            role: "tool",
            content: JSON.stringify(toolResult),
            tool_call_id: toolCall.id,
          });
        } catch (error) {
          conversation.push({
            role: "tool",
            content: JSON.stringify({ error: (error as Error).message }),
            tool_call_id: toolCall.id,
          });
        }
      }
    }

    res.status(500).json({ error: "Reached tool invocation limit" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: (error as Error).message });
  }
});

const port = Number(process.env.PORT ?? 5000);
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
