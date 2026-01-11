#!/usr/bin/env node
import WebSocket from 'ws';

const WORKER_URL = process.env.WORKER_URL || 'http://localhost:8787';

async function main() {
	console.log('Initializing sandbox...');
	await fetch(WORKER_URL);

	const portsResponse = await fetch(`${WORKER_URL}/ports`);
	const { ports } = await portsResponse.json();

	if (!ports?.length) {
		console.error('No ports exposed');
		process.exit(1);
	}

	const url = new URL(WORKER_URL);
	const previewUrl = new URL(ports[0].url);
	previewUrl.port = url.port;
	const wsUrl = previewUrl.toString().replace('http://', 'ws://');

	console.log(`Connecting to: ${wsUrl}`);

	const ws = new WebSocket(wsUrl);

	const timeout = setTimeout(() => {
		console.error('Timeout: No response within 10 seconds');
		process.exit(1);
	}, 10000);

	ws.on('open', () => {
		console.log('Connected!');
		console.log('Sending: Hello from WebSocket client!');
		ws.send('Hello from WebSocket client!');
	});

	ws.on('message', (msg) => {
		console.log('Received:', msg.toString());
		console.log('Success!');
		clearTimeout(timeout);
		ws.close();
		process.exit(0);
	});

	ws.on('error', (error) => {
		clearTimeout(timeout);
		console.error('WebSocket error:', error.message);
		process.exit(1);
	});
}

main().catch((err) => {
	console.error('Error:', err.message);
	process.exit(1);
});
