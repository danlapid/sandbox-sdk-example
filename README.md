# Sandbox SDK WebSocket Example

Demonstrates WebSocket connections working through `proxyToSandbox` from the `@cloudflare/sandbox` SDK.

## Quick Start

```bash
npm install

# Terminal 1: Start the worker
npm run dev

# Terminal 2: Run the test
npm run test
```

Expected output:

```
Initializing sandbox...
Connecting to: ws://8080-my-sandbox-<token>.localhost:8787/
Connected!
Sending: Hello from WebSocket client!
Received: {"echo":"Hello from WebSocket client!","timestamp":"..."}
Success!
```

## How It Works

1. Worker starts a WebSocket echo server inside the sandbox container on port 8080
2. Port is exposed via `sandbox.exposePort()`, generating a preview URL with a secure token
3. WebSocket connections to the preview URL are routed through `proxyToSandbox()`
