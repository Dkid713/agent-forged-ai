import express from 'express'
import type { Request, Response } from 'express'
import OpenAI from 'openai'
import type {
  ChatCompletionMessageParam,
  ChatCompletionCreateParams
} from 'openai/resources/chat/completions'
import fs from 'fs/promises'
import path from 'path'
import { spawnSync } from 'child_process'
import simpleGit, { SimpleGit } from 'simple-git'
import { Octokit } from '@octokit/rest'

type FunctionDefinition = ChatCompletionCreateParams.Function

type FunctionHandler = (args: Record<string, unknown>) => Promise<unknown>

type HandlerMap = Record<string, FunctionHandler>

const PORT = Number(process.env.AUTONOMOUS_AGI_PORT ?? 3000)
const OPENAI_KEY = process.env.OPENAI_API_KEY
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_OWNER = process.env.GITHUB_OWNER
const GITHUB_REPO = process.env.GITHUB_REPO

if (!OPENAI_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required')
}

if (!GITHUB_TOKEN) {
  throw new Error('GITHUB_TOKEN environment variable is required')
}

if (!GITHUB_OWNER || !GITHUB_REPO) {
  throw new Error('GITHUB_OWNER and GITHUB_REPO environment variables are required')
}

const app = express()
app.use(express.json({ limit: '5mb' }))

const openai = new OpenAI({ apiKey: OPENAI_KEY })
const git: SimpleGit = simpleGit(process.cwd())
const octokit = new Octokit({ auth: GITHUB_TOKEN })

const functions: FunctionDefinition[] = [
  {
    name: 'read_file',
    description: 'Read a file from the repository',
    parameters: {
      type: 'object',
      properties: {
        filepath: {
          type: 'string',
          description: 'Path to the file relative to the repository root'
        }
      },
      required: ['filepath']
    }
  },
  {
    name: 'write_file',
    description: 'Write content to a file in the repository',
    parameters: {
      type: 'object',
      properties: {
        filepath: {
          type: 'string',
          description: 'Path to the file relative to the repository root'
        },
        content: {
          type: 'string',
          description: 'The full file contents to be written'
        }
      },
      required: ['filepath', 'content']
    }
  },
  {
    name: 'run_shell',
    description: 'Execute a shell command from the repository root',
    parameters: {
      type: 'object',
      properties: {
        cmd: {
          type: 'string',
          description: 'Command to execute (without shell features)'
        }
      },
      required: ['cmd']
    }
  },
  {
    name: 'create_branch',
    description: 'Create a new git branch and switch to it',
    parameters: {
      type: 'object',
      properties: {
        branch: {
          type: 'string',
          description: 'Name of the branch to create'
        }
      },
      required: ['branch']
    }
  },
  {
    name: 'commit_changes',
    description: 'Stage all changes and create a commit',
    parameters: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Commit message to use'
        }
      },
      required: ['message']
    }
  },
  {
    name: 'push_branch',
    description: 'Push the current branch to a remote',
    parameters: {
      type: 'object',
      properties: {
        branch: {
          type: 'string',
          description: 'Branch name to push'
        },
        remote: {
          type: 'string',
          description: 'Remote name to push to',
          default: 'origin'
        }
      },
      required: ['branch']
    }
  },
  {
    name: 'create_pull_request',
    description: 'Open a pull request on GitHub',
    parameters: {
      type: 'object',
      properties: {
        head: {
          type: 'string',
          description: 'Name of the branch containing changes'
        },
        base: {
          type: 'string',
          description: 'Target branch for the PR',
          default: 'main'
        },
        title: {
          type: 'string',
          description: 'Title of the pull request'
        },
        body: {
          type: 'string',
          description: 'Body content for the pull request'
        }
      },
      required: ['head', 'title']
    }
  }
]

const fnHandlers: HandlerMap = {
  read_file: async ({ filepath }) => {
    if (typeof filepath !== 'string') {
      throw new Error('filepath must be a string')
    }
    const absolutePath = path.resolve(process.cwd(), filepath)
    const content = await fs.readFile(absolutePath, 'utf-8')
    return { content }
  },
  write_file: async ({ filepath, content }) => {
    if (typeof filepath !== 'string' || typeof content !== 'string') {
      throw new Error('filepath and content must be strings')
    }
    const absolutePath = path.resolve(process.cwd(), filepath)
    await fs.writeFile(absolutePath, content, 'utf-8')
    return { success: true }
  },
  run_shell: async ({ cmd }) => {
    if (typeof cmd !== 'string') {
      throw new Error('cmd must be a string')
    }
    const [command, ...args] = cmd.split(/\s+/)
    const result = spawnSync(command, args, {
      cwd: process.cwd(),
      encoding: 'utf-8'
    })
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      code: result.status
    }
  },
  create_branch: async ({ branch }) => {
    if (typeof branch !== 'string') {
      throw new Error('branch must be a string')
    }
    await git.checkoutLocalBranch(branch)
    return { branch }
  },
  commit_changes: async ({ message }) => {
    if (typeof message !== 'string') {
      throw new Error('message must be a string')
    }
    await git.add('.')
    const commit = await git.commit(message)
    return { sha: commit.commit }
  },
  push_branch: async ({ branch, remote }) => {
    if (typeof branch !== 'string') {
      throw new Error('branch must be a string')
    }
    const remoteName = typeof remote === 'string' ? remote : 'origin'
    await git.push(remoteName, branch, ['--set-upstream'])
    return { success: true }
  },
  create_pull_request: async ({ head, base, title, body }) => {
    if (typeof head !== 'string' || typeof title !== 'string') {
      throw new Error('head and title must be strings')
    }
    const baseBranch = typeof base === 'string' ? base : 'main'
    const response = await octokit.pulls.create({
      owner: GITHUB_OWNER!,
      repo: GITHUB_REPO!,
      head,
      base: baseBranch,
      title,
      body: typeof body === 'string' ? body : undefined
    })
    return {
      url: response.data.html_url,
      number: response.data.number
    }
  }
}

async function runChatLoop(messages: ChatCompletionMessageParam[]) {
  let response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    functions,
    function_call: 'auto'
  })

  let choice = response.choices[0]?.message

  while (choice && choice.function_call) {
    const { name, arguments: argsJson } = choice.function_call
    if (!name || !argsJson) {
      break
    }

    let args: Record<string, unknown>
    try {
      args = JSON.parse(argsJson)
    } catch (error) {
      throw new Error(`Unable to parse function call arguments: ${error}`)
    }

    const handler = fnHandlers[name]
    if (!handler) {
      throw new Error(`Unsupported function: ${name}`)
    }

    const result = await handler(args)

    messages = messages.concat([choice, {
      role: 'function',
      name,
      content: JSON.stringify(result)
    }])

    response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      functions,
      function_call: 'auto'
    })

    choice = response.choices[0]?.message
  }

  return choice?.content ?? ''
}

app.post('/chat', async (req: Request, res: Response) => {
  const incoming: unknown = req.body?.messages
  if (!Array.isArray(incoming)) {
    res.status(400).json({ error: 'messages must be an array' })
    return
  }

  const messages: ChatCompletionMessageParam[] = incoming as ChatCompletionMessageParam[]

  try {
    const reply = await runChatLoop(messages)
    res.json({ reply })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    // eslint-disable-next-line no-console
    console.error('Autonomous AGI chat error:', error)
    res.status(500).json({ error: message })
  }
})

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Autonomous AGI service listening on port ${PORT}`)
})
