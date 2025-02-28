const WebSocket = require("ws");
const express = require("express");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const crypto = require('crypto');
const winston = require("winston");
const archiver = require("archiver");
const os = require("os");
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
const blocksDir = path.join(__dirname, "blocks"); // Alterado de eventsDir para blocksDir
const backupDir = path.join(__dirname, "backups");
if (!fs.existsSync(blocksDir)) {
    fs.mkdirSync(blocksDir);
}
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
}
const wss = new WebSocket.Server({ noServer: true });
const clients = new Set();
const MAX_BLOCKS_PER_REQUEST = parseInt(process.env.MAX_BLOCKS_PER_REQUEST) || 50; // Alterado de MAX_EVENTS_PER_REQUEST
const MAX_CONNECTIONS = parseInt(process.env.MAX_CONNECTIONS) || 100;
const MAX_MESSAGE_SIZE = parseInt(process.env.MAX_MESSAGE_SIZE) || 1024 * 1024; // 1MB

// Cache de blocos em memória
const blockCache = new Map(); // Alterado de eventCache para blockCache

// Logger estruturado
const logger = winston.createLogger({
    level: "info",
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: "error.log", level: "error" }),
        new winston.transports.File({ filename: "combined.log" }),
    ],
});

// Carrega blocos no cache ao iniciar o servidor
function loadBlocksToCache() { // Alterado de loadEventsToCache
    const files = fs.readdirSync(blocksDir); // Alterado de eventsDir
    files.forEach((file) => {
        const filePath = path.join(blocksDir, file); // Alterado de eventsDir
        const block = JSON.parse(fs.readFileSync(filePath, 'utf8')); // Alterado de event para block
        blockCache.set(block.id, block); // Alterado de eventCache para blockCache
    });
    logger.info(`Carregados ${blockCache.size} blocos no cache.`); // Alterado de eventos para blocos
}
loadBlocksToCache();

function validateBlock(block) { // Alterado de validateEvent para validateBlock
    return (
        typeof block.id === "string" &&
        typeof block.pubkey === "string" &&
        typeof block.created_at === "number" &&
        typeof block.mode === "string" &&
        typeof block.content === "string" &&
        typeof block.sig === "string" &&
        typeof block.app === "string"
    );
}

// Função para salvar blocos
function saveBlock(block) { // Alterado de saveEvent para saveBlock
    try {
        const fileName = `block_${block.pubkey}_${block.id}.json`;
        const filePath = path.join(blocksDir, fileName); // Alterado de eventsDir para blocksDir
        if (typeof block !== 'object') {
            throw new Error('Bloco inválido'); // Alterado de Evento para Bloco
        }
        let formatBlock = { ...block }; // Alterado de event para block
        const signature = formatBlock.sig;
        delete formatBlock.sig;
        if (!verifySignature(block.pubkey, JSON.stringify(formatBlock), signature)) {
            logger.warn('❌ Assinatura inválida, bloco rejeitado!');
            return;
        }
        fs.writeFileSync(filePath, JSON.stringify(block, null, 2));
        blockCache.set(block.id, block); // Alterado de eventCache para blockCache
        logger.info(`Bloco ${fileName} salvo com sucesso!`);
    } catch (error) {
        logger.error("Erro ao salvar bloco:", error.message); // Alterado de evento para bloco
    }
}

// Função para verificar assinaturas
function verifySignature(publicKeyHex, message, signature) {
    try {
        const key = ec.keyFromPublic(publicKeyHex, 'hex');
        const msgHash = sha256(message);
        return key.verify(msgHash, signature);
    } catch (e) {
        logger.error('❌ Erro ao verificar a assinatura:', e.message);
        return false;
    }
}

// Função para calcular SHA-256
function sha256(message) {
    return crypto.createHash('sha256').update(message).digest('hex');
}

// Função para obter blocos filtrados
function getBlocks(filter, callback) { // Alterado de getEvents para getBlocks
    let results = Array.from(blockCache.values()).filter((block) => { // Alterado de eventCache para blockCache
        let match = true;
        if (filter.pubkey && block.pubkey !== filter.pubkey) match = false; // Alterado de event para block
        if (filter.mode && block.mode !== filter.mode) match = false; // Alterado de event para block
        if (filter.since && block.created_at < filter.since) match = false; // Alterado de event para block
        if (filter.until && block.created_at > filter.until) match = false; // Alterado de event para block
        if (filter.app && block.app !== filter.app) match = false; // Alterado de event para block
        if (filter.query && Array.isArray(filter.query) && filter.query.length > 0) {
            let parsedQuery = typeof block.query === 'string' ? JSON.parse(block.query) : block.query; // Alterado de event para block
            filter.query.forEach(([key, value]) => {
                let keyMatch = parsedQuery.some(([qKey, qValue]) => qKey === key && qValue === value);
                if (!keyMatch) {
                    match = false;
                }
            });
        }
        return match;
    });
    results.sort((a, b) => b.created_at - a.created_at);
    callback(results.slice(filter.offset || 0, (filter.offset || 0) + (filter.limit || MAX_BLOCKS_PER_REQUEST))); // Alterado de MAX_EVENTS_PER_REQUEST
}

// Backup automático
function backupBlocks() { // Alterado de backupEvents para backupBlocks
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(backupDir, `backup_${timestamp}.zip`);
    const output = fs.createWriteStream(backupPath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    output.on("close", () => {
        logger.info(`Backup criado: ${archive.pointer()} bytes`);
    });
    archive.pipe(output);
    archive.directory(blocksDir, false); // Alterado de eventsDir para blocksDir
    archive.finalize();
}
setInterval(backupBlocks, 24 * 60 * 60 * 1000); // Backup diário

// Monitoramento de métricas
setInterval(() => {
    const memoryUsage = process.memoryUsage();
    logger.info({
        type: "metrics",
        memory: {
            rss: memoryUsage.rss,
            heapTotal: memoryUsage.heapTotal,
            heapUsed: memoryUsage.heapUsed,
        },
        cpu: os.loadavg(),
        connections: clients.size,
    });
}, 60000); // A cada minuto

// WebSocket server
wss.on("connection", (ws) => {
    if (clients.size >= MAX_CONNECTIONS) {
        ws.close(1008, "Limite de conexões atingido");
        return;
    }
    clients.add(ws);
    ws.on("message", (message) => {
        if (message.length > MAX_MESSAGE_SIZE) {
            ws.close(1009, "Mensagem muito grande");
            return;
        }
        try {
            const data = JSON.parse(message);
            if (data.request === "get_blocks") { // Alterado de get_events para get_blocks
                getBlocks(data.filter || {}, (blocks) => { // Alterado de getEvents para getBlocks
                    ws.send(JSON.stringify({ response: "blocks", blocks, requestId: data.requestId })); // Alterado de events para blocks
                });
            } else if (validateBlock(data)) { // Alterado de validateEvent para validateBlock
                saveBlock(data); // Alterado de saveEvent para saveBlock
            } else {
                ws.send(JSON.stringify({ status: "erro", message: "Bloco inválido" })); // Alterado de Evento para Bloco
            }
        } catch (error) {
            logger.error("Erro ao processar mensagem:", error.message);
        }
    });
    ws.on("close", () => {
        clients.delete(ws);
    });
});

// HTTP server
const server = app.listen(port, () => {
    logger.info(`Servidor rodando em http://localhost:${port}`);
});
server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
    });
});