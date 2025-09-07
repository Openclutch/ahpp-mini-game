const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
const clients = new Set();

wss.on('connection', ws => {
  clients.add(ws);
  ws.on('message', msg => {
    for (const c of clients) {
      if (c !== ws && c.readyState === WebSocket.OPEN) {
        c.send(msg);
      }
    }
  });
  ws.on('close', () => clients.delete(ws));
});

console.log('Network server running on ws://localhost:8080');
