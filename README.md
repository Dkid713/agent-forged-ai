# Agent Forged AI Compression API

This repository documents the public REST interface for the CruxAGI Codex compression service. The API exposes a health check for uptime monitoring and an endpoint that runs the compression engine against arbitrary text.

## Base URL

```
https://518f2c93-c20c-42b4-9325-6555b0457514-00-3bvcu5ifyl6sy.picard.replit.dev
```

## Endpoints

### `GET /api/codex/status`

Performs a simple health check so you can verify the service is reachable. You should receive a JSON payload indicating that the compression service is online.

### `POST /api/codex/compress`

Runs the Codex compression engine. Submit the text you want to compress in the `message` field and optionally specify the upstream model in `model` (defaults to `gpt-3.5-turbo`). The response includes the compressed text along with metadata such as bytes saved, compression ratio, and token savings.

**Request headers**

```
Content-Type: application/json
```

**Sample request body**

```json
{
  "message": "The artificial intelligence system uses machine learning.",
  "model": "gpt-3.5-turbo"
}
```

## Quick Tests from a Mobile Device

You can validate the service directly from a phone without additional tooling.

1. **Status check** – open the following URL in a mobile browser:
   ```
   https://518f2c93-c20c-42b4-9325-6555b0457514-00-3bvcu5ifyl6sy.picard.replit.dev/api/codex/status
   ```
2. **Compression request** – use a REST client such as HTTPBot or Postman Mobile:
   - Method: `POST`
   - URL: `https://518f2c93-c20c-42b4-9325-6555b0457514-00-3bvcu5ifyl6sy.picard.replit.dev/api/codex/compress`
   - Headers: `Content-Type: application/json`
   - Body:
     ```json
     {
       "message": "The artificial intelligence system uses machine learning.",
       "model": "gpt-3.5-turbo"
     }
     ```

## Code Examples

Use any HTTP-capable client to call the compression service.

### cURL

```bash
curl -X POST \
  https://518f2c93-c20c-42b4-9325-6555b0457514-00-3bvcu5ifyl6sy.picard.replit.dev/api/codex/compress \
  -H "Content-Type: application/json" \
  -d '{
    "message": "The artificial intelligence system uses machine learning.",
    "model": "gpt-3.5-turbo"
  }'
```

### JavaScript (Browser or Node.js)

```javascript
async function compressText(message, model = "gpt-3.5-turbo") {
  const res = await fetch(
    "https://518f2c93-c20c-42b4-9325-6555b0457514-00-3bvcu5ifyl6sy.picard.replit.dev/api/codex/compress",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, model }),
    }
  );

  if (!res.ok) {
    throw new Error(`Compression failed: ${res.status}`);
  }

  return await res.json();
}

compressText("The artificial intelligence system uses machine learning.")
  .then(console.log)
  .catch(console.error);
```

### Python

```python
import requests

BASE_URL = "https://518f2c93-c20c-42b4-9325-6555b0457514-00-3bvcu5ifyl6sy.picard.replit.dev"


def compress_text(message, model="gpt-3.5-turbo"):
    url = f"{BASE_URL}/api/codex/compress"
    payload = {"message": message, "model": model}
    resp = requests.post(url, json=payload)
    resp.raise_for_status()
    return resp.json()


result = compress_text("The artificial intelligence system uses machine learning.")
print(result)
```

## OpenAPI Specification Snippet

You can integrate the API into a Custom GPT or any OpenAPI-aware client by using the following specification.

```yaml
openapi: 3.0.0
info:
  title: CruxAGI Compression API
  version: 2.0.0

servers:
  - url: https://518f2c93-c20c-42b4-9325-6555b0457514-00-3bvcu5ifyl6sy.picard.replit.dev

paths:
  /api/codex/status:
    get:
      summary: Get compression service status
      operationId: getStatus
      responses:
        '200':
          description: Service status
          content:
            application/json:
              schema:
                type: object
                additionalProperties: true

  /api/codex/compress:
    post:
      summary: Compress text with CruxAGI Codex
      operationId: compressText
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - message
              properties:
                message:
                  type: string
                  description: Text to compress
                model:
                  type: string
                  description: Upstream LLM model name (e.g. gpt-3.5-turbo)
      responses:
        '200':
          description: Compressed text and metrics
          content:
            application/json:
              schema:
                type: object
                properties:
                  original:
                    type: string
                  compressed:
                    type: string
                  codec:
                    type: string
                  muClass:
                    type: string
                  bytesSaved:
                    type: number
                  ratio:
                    type: number
                  compressionPercent:
                    type: number
                  tokensSaved:
                    type: number
```

With these details, developers and Custom GPT builders can quickly adopt the Codex compression service in their workflows.
