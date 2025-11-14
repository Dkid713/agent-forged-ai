# agent-forged-ai

## Live Compression API
Your compression service is now publicly accessible.

- **Base URL:** `https://518f2c93-c20c-42b4-9325-6555b0457514-00-3bvcu5ifyl6sy.picard.replit.dev`

### Endpoints
- **Status Check**
  - Method: `GET`
  - URL: `https://518f2c93-c20c-42b4-9325-6555b0457514-00-3bvcu5ifyl6sy.picard.replit.dev/api/codex/status`
  - Paste the URL into any browser (desktop or mobile) to confirm the API is online.
- **Compress Text**
  - Method: `POST`
  - URL: `https://518f2c93-c20c-42b4-9325-6555b0457514-00-3bvcu5ifyl6sy.picard.replit.dev/api/codex/compress`
  - Body (JSON):
    ```json
    {
      "message": "The artificial intelligence system uses machine learning.",
      "model": "gpt-3.5-turbo"
    }
    ```

### Example Result
The sample payload above produced a 28.6% compression rate:

- Original: `"The artificial intelligence system uses machine learning. ×2"`
- Compressed: `"The §01 system uses §07. ×2"`
- Bytes saved: `62`

### Integrating with ChatGPT (Custom GPT Action)
Use this OpenAPI specification when configuring a Custom GPT action:

```yaml
openapi: 3.0.0
info:
  title: CruxAGI Compression API
  version: 2.0
servers:
  - url: https://518f2c93-c20c-42b4-9325-6555b0457514-00-3bvcu5ifyl6sy.picard.replit.dev
paths:
  /api/codex/compress:
    post:
      summary: Compress text
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                message:
                  type: string
                model:
                  type: string
      responses:
        '200':
          description: Compressed text
```
