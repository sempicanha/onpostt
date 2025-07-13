require("dotenv").config();
const WebSocket = require("ws");
const winston = require("winston");
const os = require("os");
const { validateBlock } = require('./validateBlock');
const { getBlocks } = require('./getBlocks');
const { saveBlock } = require('./saveBlock');

// Configurações do ambiente
const SOCKET_MAX_CONNECTIONS = parseInt(process.env.SOCKET_MAX_CONNECTIONS) || 10000;
const SOCKET_MAX_MESSAGE_SIZE = parseInt(process.env.SOCKET_MAX_MESSAGE_SIZE) || 1024 * 1024;
const SOCKET_INACTIVITY_TIMEOUT = parseInt(process.env.SOCKET_INACTIVITY_TIMEOUT) || 600000;
const allowedOrigins = process.env.HOST_ALLOWED?.split(",") || [];

// Logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

const WebSocketServer = WebSocket.Server;
const wss = new WebSocketServer({ noServer: true });

const connections = new Map(); // Map<email, WebSocket>
const chats = new Map(); // Map<chatKey, Set<email>>

function getChatKey(userA, userB) {
  return [userA, userB].sort().join(":");
}

// Essa função vai ser chamada no main.js passando o server HTTP criado lá
function setupWebSocket(server) {
  server.on("upgrade", (req, socket, head) => {
    const origin = req.headers.origin;

    if (!allowedOrigins.includes(origin)) {
      socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
      socket.destroy();
      logger.warn(`[REJEITADO] Origem não permitida: ${origin}`);
      return;
    }

    if (connections.size >= SOCKET_MAX_CONNECTIONS) {
      socket.write("HTTP/1.1 503 Service Unavailable\r\n\r\n");
      socket.destroy();
      logger.warn(`[REJEITADO] Limite de conexões atingido: ${origin}`);
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });
}

// Toda a lógica original do wss.on("connection")
wss.on("connection", (ws, req) => {
  let from = null;
  let to = null;
  let inactivityTimer;

  const resetInactivityTimer = () => {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      ws.terminate();
      if (from) {
        connections.delete(from);
        for (const chat of chats.values()) {
          chat.delete(from);
        }
        logger.info(`[TIMEOUT] Conexão encerrada por inatividade: ${from}`);
      }
    }, SOCKET_INACTIVITY_TIMEOUT);
  };

  ws.on("message", (message) => {
    resetInactivityTimer();

    if (message.length > SOCKET_MAX_MESSAGE_SIZE) {
      ws.send(JSON.stringify({ status: "erro", message: "Mensagem muito grande" }));
      return;
    }

    try {
      const data = JSON.parse(message);
      const query = data.query || data.filter?.query || [];
      from = query.find(q => q[0] === 'from')?.[1] || from;
      to = query.find(q => q[0] === 'to')?.[1] || to;

      if (data.request === 'get_blocks_sub') {
        from = query.find(q => q[0] === 'from')?.[1] || data.filter?.pubkey || from;
        to = query.find(q => q[0] === 'to')?.[1] || to;

        if (!from || !to) {
          ws.send(JSON.stringify({ status: "erro", message: "Falta 'from' ou 'to' em query:" }));
          return;
        }

        const pubkey = data.filter?.pubkey || from;
        if (pubkey) {
          connections.set(pubkey, ws);
        }

        const key = getChatKey(from, to);
        if (!chats.has(key)) chats.set(key, new Set());
        chats.get(key).add(from);

        getBlocks(data.filter || {}, (blocks) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ response: "blocks", blocks }));
          }
        });
        return;
      }

      if (data.mode === "message" && from && to) {
        if (!validateBlock(data)) {
          ws.send(JSON.stringify({ status: "erro", message: `Bloco inválido de ${from} para ${to}` }));
          return;
        }

        const key = getChatKey(from, to);
        const participants = chats.get(key);

        if (!participants || !participants.has(from)) {
          ws.send(JSON.stringify({ status: "erro", message: `${from} tentou enviar mensagem sem estar na conversa` }));
          return;
        }

        saveBlock(data, function (resp) {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(resp));
          }
        });

        const payload = JSON.stringify({
          response: "blocks",
          blocks: [data]
        });

        for (const participant of participants) {
          const sock = connections.get(participant);
          if (sock && sock.readyState === WebSocket.OPEN) {
            sock.send(payload);
          }
        }
        return;
      }

    } catch (err) {
      logger.error(`Falha ao processar mensagem: ${err.message}`, { stack: err.stack });
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            status: "erro",
            message: "Falha ao processar mensagem: " + err.message
          }));
        }
      } catch {}
    }
  });

  ws.on("close", () => {
    clearTimeout(inactivityTimer);
    if (from) {
      connections.delete(from);
      for (const chat of chats.values()) {
        chat.delete(from);
      }
      logger.info(`[CLOSE] Conexão encerrada para ${from}`);
    }
  });

  ws.on("error", (err) => {
    logger.error(`WebSocket error: ${err.message}`, { stack: err.stack });
  });

  resetInactivityTimer();
});

// Log de métricas periódicas
setInterval(() => {
  const memoryUsage = process.memoryUsage();
  logger.info({
    type: "metrics",
    memory: memoryUsage,
    cpu: os.loadavg(),
    connections: connections.size,
  });
}, 60000);

// Captura erros não tratados pelo Node.js para evitar crash do servidor
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
  // NÃO FINALIZAR processo para manter o servidor rodando
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection: ${reason}`, { promise });
  // NÃO FINALIZAR processo para manter o servidor rodando
});

module.exports = { setupWebSocket };
