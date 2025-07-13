const winston = require("winston");
const crypto = require("crypto");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");
const { Pool } = require("pg");

//conection postgree
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.MAX_POOL_SIZE) || 20, // limite conexões no pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});


//criar logs .txt
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});



//Limite Variaveis
const MAX_CONNECTIONS = parseInt(process.env.MAX_CONNECTIONS) || 100;
const MAX_MESSAGE_SIZE = parseInt(process.env.MAX_MESSAGE_SIZE) || 1024 * 1024;
const INACTIVITY_TIMEOUT = 600000;
const MAX_BLOCKS_PER_REQUEST = parseInt(process.env.MAX_BLOCKS_PER_REQUEST) || 1000;


//filtros sub, list
const {
  filterByPubkey,
  filterByMode,
  filterBySince,
  filterByUntil,
  filterByApp,
  filterById,
  filterByQuery,
  filterByProfile,
  filterByMessage
} = require("./filters");

//Mode permitidos
const validModes = require('./mode');

//get Blocks
async function getBlocks(filter, callback) {
  try {

    if (!filter.mode || !validModes.includes(filter.mode)) {
      throw new Error(`'mode' inválido ou ausente. Permitidos: ${validModes.join(', ')}`);
    }

    const conditions = ["deleted = false"];
    const params = [];
    let idx = 1;




    if (filter.pubkey) {
      conditions.push(`pubkey = $${idx++}`);
      params.push(filter.pubkey);
    }

    if (filter.mode) {
      conditions.push(`mode = $${idx++}`);
      params.push(filter.mode);
    }

    if (filter.since) {
      conditions.push(`created_at >= $${idx++}`);
      params.push(filter.since);
    }

    if (filter.until) {
      conditions.push(`created_at <= $${idx++}`);
      params.push(filter.until);
    }

    if (filter.app) {
      conditions.push(`app = $${idx++}`);
      params.push(filter.app);
    }

    if (filter.id) {
      conditions.push(`id = $${idx++}`);
      params.push(filter.id);
    }


    if (filter.mode === "message" && Array.isArray(filter.query)) {
      const fromToPairs = filter.query.filter(pair =>
        Array.isArray(pair) &&
        pair.find(([k]) => k === 'from') &&
        pair.find(([k]) => k === 'to')
      );

      if (fromToPairs.length) {
        const orConditions = [];

        for (const pair of fromToPairs) {
          const from = pair.find(([k]) => k === 'from')?.[1];
          const to = pair.find(([k]) => k === 'to')?.[1];
          if (from && to) {
            orConditions.push(`("from" = $${idx} AND "to" = $${idx + 1})`);
            params.push(from, to);
            idx += 2;
          }
        }

        if (orConditions.length) {
          conditions.push(`(${orConditions.join(' OR ')})`);
        }
      }
    }



    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const limit = Math.min(filter.limit || MAX_BLOCKS_PER_REQUEST, MAX_BLOCKS_PER_REQUEST);
    const offset = filter.offset || 0;

    const queryText = `SELECT id, app, content, created_at, mode, pubkey, query, sig FROM blocks ${whereClause} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const res = await pool.query(queryText, params);
    let results = res.rows;

    // 🔧 Filtro adicional para query JSON (só se necessário)
    if (filter.query && filter.mode !== "message") {
      results = results.filter((block) => filterByQuery(block, filter.query));
    }

    if (filter.mode === "profile") {
      results = filterByProfile(results);
    }


    callback(results);


  } catch (err) {
    logger.error("Erro ao buscar blocos:", err.message);
    callback([]);
  }
}

module.exports = {getBlocks};