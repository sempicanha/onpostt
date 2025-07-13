const winston = require("winston");
const crypto = require("crypto");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");
const { Pool } = require("pg");

// Mode permitidos
const validModes = require('./mode');

//conection postgree
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.MAX_POOL_SIZE) || 20, // limite conexões no pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});


const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

function sha256(message) {
  return crypto.createHash("sha256").update(message).digest("hex");
}


function verifySignature(publicKeyHex, message, signature) {
  try {
    const key = ec.keyFromPublic(publicKeyHex, "hex");
    const msgHash = sha256(message);
    return key.verify(msgHash, signature);
  } catch (e) {
    logger.error("Erro ao verificar assinatura:", e.message);
    return false;
  }
}


async function saveBlock(block, callback) {
  try {

    if (!block.mode || !validModes.includes(block.mode)) {
      throw new Error(`'mode' inválido ou ausente. Permitidos: ${validModes.join(', ')}`);
    }

    if (typeof block !== "object") {
      throw new Error("Bloco inválido");
    }

    let formatBlock = { ...block };
    const signature = formatBlock.sig;
    delete formatBlock.sig;

    // Verifica assinatura
    if (!verifySignature(block.pubkey, JSON.stringify(formatBlock), signature)) {
 
        return callback({
          status: "erro",
          message: "Assinatura inválida. Bloco rejeitado.",
        });
    }

  
    if (block.mode === "delete") {
        const pubkey = block.pubkey;

        console.log(pubkey);

        // Verifica se existe o campo "block"
        const blockQueryItem = block.query.find(([k]) => k === 'block');

        if (!blockQueryItem || !blockQueryItem[1]) {
            throw new Error('Campo "block" ausente ou inválido em query');
        }

        // Valida se só existem os campos permitidos
        const allowedKeys = new Set(['block']);
        const invalidKeys = block.query.filter(([k]) => !allowedKeys.has(k));

        if (invalidKeys.length > 0) {
            throw new Error(`Query contém campos inválidos: ${invalidKeys.map(([k]) => k).join(', ')}`);
        }

        // Impede campos duplicados
        const keysSeen = new Set();
        const duplicatedKeys = [];

        for (const [key] of block.query) {
            if (keysSeen.has(key)) {
                duplicatedKeys.push(key);
            } else {
                keysSeen.add(key);
            }
        }

        if (duplicatedKeys.length > 0) {
            throw new Error(`Query contém campos duplicados: ${[...new Set(duplicatedKeys)].join(', ')}`);
        }

        const blockId = blockQueryItem[1];
       
        const result = await pool.query(
          `DELETE FROM blocks 
           WHERE id = $1 AND pubkey = $2 AND mode IN ('post', 'message') 
           RETURNING *`,
          [blockId, pubkey]
        );
        

        if (result.rowCount === 0) {
           
            return callback({
                    status: "error",
                    message: `Bloco alvo (${blockId}) não encontrado ou não pertence ao autor.`,
            });
        }

       
        return callback({
                status: "success",
                message: `Bloco ${blockId} deletado com sucesso.`,
        });
    }



    // Serializa content e query sempre para strings JSON
    const contentToStore = JSON.stringify(block.content);
    const queryToStore = JSON.stringify(block.query || []);

    //logica para publicar um bloco post --------------------------------------------------------------
    if(block.mode === 'post'){
      await pool.query(
        `INSERT INTO blocks (id, pubkey, created_at, mode, content, sig, app, query, deleted)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false)
         ON CONFLICT (id) DO NOTHING`,
        [
          block.id,
          block.pubkey,
          block.created_at,
          block.mode,
          contentToStore,
          signature,
          block.app,
          queryToStore,
        ]
      );
    }


    //logica para follow--------------------------------------------------------------------------------
    if (block.mode === 'follow') {
        const pubkey = block.pubkey;

        const followingItem = block.query.find(([k]) => k === 'following');
        const followerItem = block.query.find(([k]) => k === 'follower');

        if (!followingItem || !followingItem[1]) {
            throw new Error('Campo "following" ausente ou inválido em query');
        }

        if (!followerItem || !followerItem[1]) {
            throw new Error('Campo "follower" ausente ou inválido em query');
        }

        // Valida se só existem os campos permitidos
        const allowedKeys = new Set(['following', 'follower']);
        const invalidKeys = block.query.filter(([k]) => !allowedKeys.has(k));

        if (invalidKeys.length > 0) {
            throw new Error(`Query contém campos inválidos: ${invalidKeys.map(([k]) => k).join(', ')}`);
        }

        // Verifica se há chaves duplicadas
        const keysSeen = new Set();
        const duplicatedKeys = [];

        for (const [key] of block.query) {
            if (keysSeen.has(key)) {
                duplicatedKeys.push(key);
            } else {
                keysSeen.add(key);
            }
        }

        if (duplicatedKeys.length > 0) {
            throw new Error(`Query contém campos duplicados: ${[...new Set(duplicatedKeys)].join(', ')}`);
        }

        const pubkeyUser = followingItem[1];
        const queryJson = JSON.stringify([["following", pubkeyUser]]);

        const result = await pool.query(
          `DELETE FROM blocks 
           WHERE pubkey = $1
             AND mode = 'follow'
             AND query @> $2::jsonb
           RETURNING id`,
          [pubkey, queryJson]
        );

        if (result.rowCount === 0) {
          await pool.query(
            `INSERT INTO blocks (id, pubkey, created_at, mode, content, sig, app, query, deleted)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false)
             ON CONFLICT (id) DO NOTHING`,
            [
              block.id,
              pubkey,
              block.created_at,
              block.mode,
              contentToStore,
              signature,
              block.app,
              queryToStore,
            ]
          );
        }
    }


    //logica para like----------------------------------------------------------------
    if (block.mode === 'like') {
        const pubkey = block.pubkey;

        // Verifica se existe um item "block" no query
        const blockQueryItem = block.query.find(([k]) => k === 'block');

        if (!blockQueryItem || !blockQueryItem[1]) {
            throw new Error('Campo "block" ausente ou inválido em query');
        }

        const blockId = blockQueryItem[1];

        // Garante que só o campo "block" seja permitido
        const allowedKeys = new Set(['block']);
        const invalidKeys = block.query.filter(([k]) => !allowedKeys.has(k));
        if (invalidKeys.length > 0) {
            throw new Error(`Query contém campos inválidos: ${invalidKeys.map(([k]) => k).join(', ')}`);
        }

        // Verifica se há chaves duplicadas
        const keysSeen = new Set();
        const duplicatedKeys = [];

        for (const [key] of block.query) {
            if (keysSeen.has(key)) {
                duplicatedKeys.push(key);
            } else {
                keysSeen.add(key);
            }
        }

        if (duplicatedKeys.length > 0) {
            throw new Error(`Query contém campos duplicados: ${[...new Set(duplicatedKeys)].join(', ')}`);
        }

        const queryJson = JSON.stringify([["block", blockId]]);

        // Tenta remover registros existentes (descurtir)
        const result = await pool.query(
          `DELETE FROM blocks 
           WHERE pubkey = $1
             AND mode = 'like'
             AND query @> $2::jsonb
           RETURNING id`,
          [pubkey, queryJson]
        );

        // Se nenhum foi removido, então insere novo (curtir)
        if (result.rowCount === 0) {
            await pool.query(
                `INSERT INTO blocks (id, pubkey, created_at, mode, content, sig, app, query, deleted)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false)
                 ON CONFLICT (id) DO NOTHING`,
                [
                    block.id,
                    pubkey,
                    block.created_at,
                    block.mode,
                    contentToStore,
                    signature,
                    block.app,
                    queryToStore,
                ]
            );
        }
    }


    
    //logica comentario ----------------------------------------------------------------------
    if (block.mode === 'comment') {
        const pubkey = block.pubkey;

        // Verifica se existe um item "block" no query
        const blockQueryItem = block.query.find(([k]) => k === 'block');

        if (!blockQueryItem || !blockQueryItem[1]) {
            throw new Error('Campo "block" ausente ou inválido em query');
        }

        const blockId = blockQueryItem[1];

        // Garante que só o campo "block" seja permitido
        const allowedKeys = new Set(['block']);
        const invalidKeys = block.query.filter(([k]) => !allowedKeys.has(k));
        if (invalidKeys.length > 0) {
            throw new Error(`Query contém campos inválidos: ${invalidKeys.map(([k]) => k).join(', ')}`);
        }

        // Verifica se há chaves duplicadas
        const keysSeen = new Set();
        const duplicatedKeys = [];

        for (const [key] of block.query) {
            if (keysSeen.has(key)) {
                duplicatedKeys.push(key);
            } else {
                keysSeen.add(key);
            }
        }

        if (duplicatedKeys.length > 0) {
            throw new Error(`Query contém campos duplicados: ${[...new Set(duplicatedKeys)].join(', ')}`);
        }

      
        // Se nenhum foi removido, então insere novo (curtir)
        
        await pool.query(
            `INSERT INTO blocks (id, pubkey, created_at, mode, content, sig, app, query, deleted)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false)
             ON CONFLICT (id) DO NOTHING`,
            [
                block.id,
                pubkey,
                block.created_at,
                block.mode,
                contentToStore,
                signature,
                block.app,
                queryToStore,
            ]
        );
        
    }


   

  if (block.mode === 'message') {
    const fromEntry = (block.query || []).find(item => item[0] === 'from');
    const toEntry = (block.query || []).find(item => item[0] === 'to');

    if (fromEntry && toEntry) {
      const senderPubkey = fromEntry[1];
      const recipientPubkey = toEntry[1];

      const originalBlockId = block.id;
      const recipientBlockId = block.id + '_rcp';

      // Bloco do remetente (original)
      await pool.query(
        `INSERT INTO blocks (id, pubkey, created_at, mode, content, sig, app, query, deleted, "from", "to")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, $9, $10)
         ON CONFLICT (id) DO NOTHING`,
        [
          originalBlockId,
          senderPubkey,
          block.created_at,
          block.mode,
          contentToStore,
          signature,
          block.app,
          queryToStore,
          senderPubkey,    // from
          recipientPubkey  // to
        ]
      );

      // Bloco do receptor (cópia)
      await pool.query(
            `INSERT INTO blocks (id, pubkey, created_at, mode, content, sig, app, query, deleted, "from", "to")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, $9, $10)
             ON CONFLICT (id) DO NOTHING`,
            [
              recipientBlockId,
              recipientPubkey,
              block.created_at,
              block.mode,
              contentToStore,
              signature,
              block.app,
              queryToStore,
              senderPubkey,    // from
              recipientPubkey  // to
            ]
          );
        }
    }//mode message
        return callback({
          status: "success",
          message: `Bloco ${block.id} publicado.`,
        });
    }catch (error) {
        logger.error("Erro ao salvar bloco:", error);
        return callback({
          status: "erro",
          message: `Erro ao salvar bloco: ${error.message}`,
        });
  }
}

module.exports = {saveBlock, verifySignature, sha256, pool};