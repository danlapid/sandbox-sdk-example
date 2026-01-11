/**
 * Sandbox SDK WebSocket Example
 *
 * Demonstrates WebSocket connections working through proxyToSandbox.
 */
import { getSandbox, proxyToSandbox, type Sandbox } from '@cloudflare/sandbox';

export { Sandbox } from '@cloudflare/sandbox';

type Env = {
	Sandbox: DurableObjectNamespace<Sandbox>;
};

const WS_SERVER_CODE = `
const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('message', (message) => {
    console.log('Received:', message.toString());
    ws.send(JSON.stringify({ echo: message.toString(), timestamp: new Date().toISOString() }));
  });
  ws.on('close', () => console.log('Client disconnected'));
});

console.log('WebSocket server on port 8080');
`;

let wsServerStarted = false;

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const sandbox = getSandbox(env.Sandbox, 'my-sandbox');

		// Start WebSocket server in container on first request
		if (!wsServerStarted) {
			await sandbox.writeFile('/workspace/ws_server.js', WS_SERVER_CODE);
			await sandbox.exec('cd /workspace && npm install ws');
			await sandbox.startProcess('node /workspace/ws_server.js', { processId: 'ws-server' });
			await sandbox.exposePort(8080, { hostname: url.hostname });
			wsServerStarted = true;
			await new Promise((r) => setTimeout(r, 1000));
		}

		// Route requests to exposed sandbox ports (including WebSocket upgrades)
		const sandboxResponse = await proxyToSandbox(request, env);
		if (sandboxResponse) {
			// WebSocket upgrades must be returned as-is
			if (sandboxResponse.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
				return sandboxResponse;
			}

			// Add CORS headers for non-websocket responses
			const headers = new Headers(sandboxResponse.headers);
			headers.set('Access-Control-Allow-Origin', '*');
			return new Response(sandboxResponse.body, {
				status: sandboxResponse.status,
				statusText: sandboxResponse.statusText,
				headers,
			});
		}

		// Return the preview URL so the test script can connect
		if (url.pathname === '/ports') {
			const ports = await sandbox.getExposedPorts(url.hostname);
			return Response.json({ ports });
		}

		return new Response('Sandbox WebSocket example - use /ports to get the WebSocket URL');
	},
};
