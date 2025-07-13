require("dotenv").config();
const express = require("express");
const cors = require("cors");
const winston = require("winston");
const os = require("os");

// módulos
const { getBlocks } = require("./getBlocks");
const { saveBlock } = require("./saveBlock");

const app = express();
const port = process.env.PORT_HTTP || 3000;

// Hosts permitidos (mesma variável do WS)
const HOST_ALLOWED = process.env.HOST_ALLOWED
  ? process.env.HOST_ALLOWED.split(',').map(host => host.trim())
  : ['*'];

// Limites HTTP do env
const HTTP_MAX_CONNECTIONS = parseInt(process.env.HTTP_MAX_CONNECTIONS) || 2000;
const HTTP_MAX_MESSAGE_SIZE = parseInt(process.env.HTTP_MAX_MESSAGE_SIZE) || 262144; // 256 KB

// Contador simples de conexões ativas (HTTP)
let activeConnections = 0;

// Middleware para limitar número de conexões simultâneas
app.use((req, res, next) => {
  if (activeConnections >= HTTP_MAX_CONNECTIONS) {
    res.status(503).json({ status: "erro", message: "Limite máximo de conexões simultâneas atingido" });
    return;
  }
  activeConnections++;
  res.on('finish', () => {
    activeConnections--;
  });
  next();
});

// Middleware para limitar tamanho da requisição JSON
app.use(express.json({ limit: HTTP_MAX_MESSAGE_SIZE }));

// Middleware CORS customizado
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Postman, curl etc
    if (HOST_ALLOWED.includes('*') || HOST_ALLOWED.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origem não permitida pelo CORS'));
    }
  }
}));

// Logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// Rotas HTTP
app.post('/get_blocks_list', (req, res, next) => {
  try {
    const filter = req.body;
    getBlocks(filter || {}, (blocks) => {
      res.json({ response: "blocks", blocks, requestId: '' });
    });
  } catch (err) {
    next(err);
  }
});

app.post('/save_block', (req, res, next) => {
  try {
    const block = req.body;
    saveBlock(block, (resp) => {
      res.json(resp);
    });
  } catch (err) {
    next(err);
  }
});



app.post('/status', (req, res, next) => {
  try {
    res.json({ status: true });
  } catch (err) {
    next(err);
  }
});

// Middleware para captura de erros do Express (deve vir após as rotas)
app.use((err, req, res, next) => {
  logger.error(`Erro na rota ${req.method} ${req.url}: ${err.message}`, { stack: err.stack });
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ status: "error", message: "Erro interno no servidor" });
});

// Log de métricas periódicas
setInterval(() => {
  const memoryUsage = process.memoryUsage();
  logger.info({
    type: "metrics",
    memory: memoryUsage,
    cpu: os.loadavg(),
    activeConnections
  });
}, 60000);

// Captura erros não tratados pelo Node.js para evitar crash do servidor
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
  // NÂO FINALIZAR processo para manter o servidor rodando
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection: ${reason}`, { promise });
  // NÂO FINALIZAR processo para manter o servidor rodando
});

module.exports = app;