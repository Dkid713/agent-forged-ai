(() => {
  const SAFE_OPTS = { num_ctx: 2048, num_gpu: 0, low_vram: true, num_batch: 16 };
  const ORDERED_MODELS = [
    'llama3.1:8b-instruct-q5_1',
    'llama3.1:8b-instruct-q4_K_M',
    'llama3.2:3b',
  ];

  class OllamaClient {
    constructor() {
      this.ollamaUrl = 'http://127.0.0.1:11434';
    }

    async tags() {
      const res = await fetch(`${this.ollamaUrl}/api/tags`);
      if (!res.ok) throw new Error(`Tag fetch failed: ${res.status}`);
      return res.json();
    }

    async gen(model, prompt, signal) {
      return fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, stream: true, options: SAFE_OPTS }),
        signal,
      });
    }
  }

  class UI {
    constructor() {
      this.status = document.getElementById('status');
      this.log = document.getElementById('log');
      this.form = document.getElementById('prompt-form');
      this.prompt = document.getElementById('prompt');
      this.sendBtn = document.getElementById('send-btn');
      this.controller = null;

      this.client = new OllamaClient();
      this.installed = new Set();
      this.model = '';

      this.handleSubmit = this.handleSubmit.bind(this);
    }

    setStatus(text) {
      this.status.textContent = text;
    }

    appendLog(role, text) {
      const entry = document.createElement('div');
      entry.className = 'log-entry';
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.innerHTML = `<span>${role}</span><span>${new Date().toLocaleTimeString()}</span>`;
      const body = document.createElement('div');
      body.className = 'text';
      body.textContent = text;
      entry.append(meta, body);
      this.log.appendChild(entry);
      this.log.scrollTop = this.log.scrollHeight;
    }

    getSelectedModel(installed) {
      if (installed.has('llama3.2:3b')) return 'llama3.2:3b';
      if (installed.has('llama3.1:8b-instruct-q5_1')) return 'llama3.1:8b-instruct-q5_1';
      if (installed.has('llama3.1:8b-instruct-q4_K_M')) return 'llama3.1:8b-instruct-q4_K_M';
      return [...installed][0] || '';
    }

    async init() {
      try {
        const tags = await this.client.tags();
        (tags.models || []).forEach((m) => this.installed.add(m.name));
        this.model = this.getSelectedModel(this.installed);
        if (!this.model) {
          this.setStatus('No models installed');
          return;
        }
        this.setStatus(`Connected to Ollama (${this.model})`);
        console.info('Connected to Ollama');
      } catch (err) {
        console.error(err);
        this.setStatus('Failed to reach Ollama');
      }

      this.form.addEventListener('submit', this.handleSubmit);
    }

    async handleSubmit(event) {
      event.preventDefault();
      const prompt = this.prompt.value.trim();
      if (!prompt || !this.model) return;

      this.appendLog('You', prompt);
      this.prompt.value = '';
      this.sendBtn.disabled = true;

      try {
        const reply = await this.runWithFallback(this.model, prompt);
        this.appendLog('Assistant', reply);
      } catch (err) {
        console.error(err);
        this.appendLog('System', `Error: ${err.message || err}`);
        this.setStatus('Generation failed');
      } finally {
        this.sendBtn.disabled = false;
      }
    }

    async runWithFallback(model, prompt) {
      try {
        return await this.streamGenerate(model, prompt);
      } catch (err) {
        const fallback = this.nextSmallerModel(model);
        const needsRetry = err.status === 500 || /runner/i.test(err.message || '');
        if (fallback && needsRetry) {
          this.setStatus(`Retrying with ${fallback}`);
          return this.streamGenerate(fallback, prompt);
        }
        throw err;
      }
    }

    nextSmallerModel(current) {
      const available = ORDERED_MODELS.filter((m) => this.installed.has(m));
      const index = available.indexOf(current);
      if (index === -1) return available.at(-1) || '';
      return available[index + 1] || '';
    }

    async streamGenerate(model, prompt) {
      this.controller?.abort();
      this.controller = new AbortController();
      const response = await this.client.gen(model, prompt, this.controller.signal);
      if (!response.ok) {
        const text = await response.text();
        const error = new Error(text || 'Request failed');
        error.status = response.status;
        throw error;
      }

      this.setStatus(`Streaming from ${model}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let output = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split(/\n+/);
        buffer = parts.pop() || '';
        for (const part of parts) {
          if (!part.trim()) continue;
          try {
            const json = JSON.parse(part);
            if (json.response) {
              output += json.response;
              this.updateLastAssistant(output);
            }
          } catch (err) {
            console.warn('Chunk parse failed', err);
          }
        }
      }

      if (buffer.trim()) {
        try {
          const json = JSON.parse(buffer);
          if (json.response) {
            output += json.response;
            this.updateLastAssistant(output);
          }
        } catch (err) {
          console.warn('Tail parse failed', err);
        }
      }

      return output.trim();
    }

    updateLastAssistant(content) {
      let last = this.log.lastElementChild;
      if (!last || !last.classList.contains('assistant-live')) {
        last = document.createElement('div');
        last.className = 'log-entry assistant-live';
        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.innerHTML = `<span>Assistant</span><span>${new Date().toLocaleTimeString()}</span>`;
        const body = document.createElement('div');
        body.className = 'text';
        body.textContent = '';
        last.append(meta, body);
        this.log.appendChild(last);
      }
      last.querySelector('.text').textContent = content;
      this.log.scrollTop = this.log.scrollHeight;
    }
  }

  const onReady = () => {
    const ui = new UI();
    ui.init();
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    onReady();
  } else {
    document.addEventListener('DOMContentLoaded', onReady);
  }
})();
