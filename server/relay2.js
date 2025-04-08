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
const blocksDir = path.join(__dirname, "blocks");
const backupDir = path.join(__dirname, "backups");

// Importando as funções do arquivo filters.js
const {
    filterByPubkey,
    filterByMode,
    filterBySince,
    filterByUntil,
    filterByApp,
    filterById,
    filterByQuery,
    filterByProfile
} = require('./filters');

if (!fs.existsSync(blocksDir)) {
    fs.mkdirSync(blocksDir);
}
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
}
const wss = new WebSocket.Server({ noServer: true });
const clients = new Set();
const MAX_BLOCKS_PER_REQUEST = parseInt(process.env.MAX_BLOCKS_PER_REQUEST) || 1000;
const MAX_CONNECTIONS = parseInt(process.env.MAX_CONNECTIONS) || 100;
const MAX_MESSAGE_SIZE = parseInt(process.env.MAX_MESSAGE_SIZE) || 1024 * 1024; // 1MB

// Logger estruturado
const logger = winston.createLogger({
    level: "info",
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: "error.log", level: "error" }),
        new winston.transports.File({ filename: "combined.log" }),
    ],
});

function validateBlock(block) {
    if (block.mode === "delete") {
        return (
            typeof block.id === "string" &&
            typeof block.pubkey === "string" &&
            typeof block.created_at === "number" &&
            typeof block.mode === "string" &&
            typeof block.blockId === "string" && // ID do bloco a ser deletado
            typeof block.sig === "string"
        );
    } else {
        return (
            typeof block.id === "string" &&
            typeof block.pubkey === "string" &&
            typeof block.created_at === "number" &&
            typeof block.mode === "string" &&
            typeof block.content === "string" || typeof block.content === "object" &&
            typeof block.sig === "string" &&
            typeof block.app === "string"
        );
    }
}

const MAX_TIMESTAMP_DIFF = 60 * 60; // 1 hora

function validateTimestamp(block) {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    return (currentTimestamp - block.created_at) <= MAX_TIMESTAMP_DIFF;
}

// Função para salvar blocos
function saveBlock(block, ws) {
    try {
        const fileName = `block_${block.pubkey}_${block.id}.json`;
        const filePath = path.join(blocksDir, fileName);

        if (typeof block !== 'object') {
            throw new Error('Bloco inválido');
        }

        let formatBlock = { ...block };
        const signature = formatBlock.sig;
        delete formatBlock.sig;

        if (!verifySignature(block.pubkey, JSON.stringify(formatBlock), signature)) {
            logger.warn('❌ Assinatura inválida, bloco rejeitado!');
            
            // Enviar resposta de erro de volta ao cliente
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    status: 'erro',
                    message: 'Assinatura inválida. Bloco rejeitado.'
                }));
            }
            return;
        }

        if (block.mode === "delete") {
            const targetFilePath = path.join(blocksDir, `block_${block.pubkey}_${block.blockId}.json`);
            if (!fs.existsSync(targetFilePath)) {
                logger.warn(`❌ Bloco alvo (${block.blockId}) não encontrado.`);
                
                // Enviar resposta de erro de volta ao cliente
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        status: 'erro',
                        message: `Bloco alvo (${block.blockId}) não encontrado.`
                    }));
                }
                return;

            }

            const targetBlock = JSON.parse(fs.readFileSync(targetFilePath, 'utf8'));
            if (targetBlock.pubkey !== block.pubkey) {
                logger.warn(`❌ Tentativa de deletar bloco de outro autor.`);
                
                // Enviar resposta de erro de volta ao cliente
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        status: 'erro',
                        message: `Tentativa de deletar bloco de outro autor.`
                    }));
                }
                return;

            }

            targetBlock.deleted = true; // Marca o bloco como deletado
            fs.writeFileSync(targetFilePath, JSON.stringify(targetBlock, null, 2));
            logger.info(`✅ Bloco ${block.blockId} marcado como deletado.`);

            // Enviar resposta de erro de volta ao cliente
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    status: 'erro',
                    message: `Bloco ${block.blockId} marcado como deletado.`
                }));
            }

        } else {
            if (block.mode === 'message' && block.query[1][0] === 'recipient') {
                const recipientPubkey = block.query[1][1];
                const recipientFilePath = path.join(blocksDir, `block_${recipientPubkey}_${block.id}.json`);
                
                fs.writeFileSync(recipientFilePath, JSON.stringify(block, null, 2));
                logger.info(`Bloco com recipient ${recipientPubkey} salvo com sucesso!`);
            }

            fs.writeFileSync(filePath, JSON.stringify(block, null, 2));
            logger.info(`Bloco com filePath salvo com sucesso!`);

            ws.send(JSON.stringify({
                status: 'success',
                message: `Bloco ${block.blockId} publicado.`
            }));
            
        }
    } catch (error) {
        logger.error("Erro ao salvar bloco:", error.message);
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

function getBlocks(filter, callback) {
    
    const files = fs.readdirSync(blocksDir);
    let results = files.map(file => {
        const filePath = path.join(blocksDir, file);
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }).filter(block => {
        // Ignora blocos marcados como deletados
        if (block.deleted) return false;

        // Aplica todos os filtros
        let match = true;
        match = match && filterByPubkey(block, filter.pubkey);
        match = match && filterByMode(block, filter.mode);
        match = match && filterBySince(block, filter.since);
        match = match && filterByUntil(block, filter.until);
        match = match && filterByApp(block, filter.app);
        match = match && filterById(block, filter.id);
        match = match && filterByQuery(block, filter.query);

        return match;
    });

    // Se o modo for "profile", manter apenas o mais recente por pubkey
    if (filter.mode === "profile") {
        results = filterByProfile(results);
    }

    // Ordena os resultados por timestamp (mais recente primeiro)
    results.sort((a, b) => b.created_at - a.created_at);
    callback(results.slice(filter.offset || 0, (filter.offset || 0) + (filter.limit || MAX_BLOCKS_PER_REQUEST)));
}

// Backup automático
function backupBlocks() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(backupDir, `backup_${timestamp}.zip`);
    const output = fs.createWriteStream(backupPath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    output.on("close", () => {
        logger.info(`Backup criado: ${archive.pointer()} bytes`);
    });
    archive.pipe(output);
    archive.directory(blocksDir, false);
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
            if (data.request === "get_blocks") {
                getBlocks(data.filter || {}, (blocks) => {
                    ws.send(JSON.stringify({ response: "blocks", blocks, requestId: data.requestId })); 
                });
            } else if (validateBlock(data)) {
                saveBlock(data);
            } else {
                ws.send(JSON.stringify({ status: "erro", message: "Bloco inválido" }));
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