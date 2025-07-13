require('dotenv').config();
const http = require('http');
const express = require('express');
const { setupWebSocket } = require('./relay-socket');
const relayHttp = require('./relay-http');

const app = express();

// Usa o express do relay-http (ele exporta a app no final)
app.use(relayHttp);

const port = process.env.PORT_HTTP || 3000;

const server = http.createServer(app);

// Configura o WebSocket no mesmo servidor HTTP
setupWebSocket(server);

server.listen(port, () => {
  console.log(`Servidor HTTP + WebSocket rodando na porta ${port}`);
});
