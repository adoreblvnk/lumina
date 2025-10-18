const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const channels = {
  teacher: new Set(),
};

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const channel = url.searchParams.get('channel');

  if (channels[channel]) {
    channels[channel].add(ws);
    console.log(`Client connected to ${channel}`);

    ws.on('message', (message) => {
      // Teacher dashboard only receives messages, so we just log it for debugging.
      console.log(`Received message on ${channel}: ${message}`);
    });

    ws.on('close', () => {
      channels[channel].delete(ws);
      console.log(`Client disconnected from ${channel}`);
    });
  } else {
    ws.close();
    console.log('Invalid channel');
  }
});

// This is a simple endpoint to allow other parts of the backend to send alerts.
app.use(express.json());
app.post('/alert', (req, res) => {
  const { message } = req.body;
  console.log('Received alert:', message); // Added log
  if (message && channels.teacher.size > 0) {
    const alertMessage = JSON.stringify({ type: 'SEVERE_ALERT', payload: { message } });
    channels.teacher.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(alertMessage);
      }
    });
    console.log('Alert broadcasted to teacher dashboard'); // Added log
    res.status(200).send('Alert sent');
  } else {
    console.log('Alert failed: No message or no teacher clients connected'); // Added log
    res.status(400).send('No message or no teacher clients connected');
  }
});


server.listen(3001, () => {
  console.log('WebSocket server for teacher dashboard is listening on port 3001');
});
