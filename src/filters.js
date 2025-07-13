function filterByPubkey(block, pubkey) {
    const recipientQuery = block.query ? block.query.find(item => item[0] === 'to') : null;
    return pubkey ? block.pubkey === pubkey : true;
}

function filterByMessage(block, queries) {
  if (!queries || !Array.isArray(queries) || queries.length === 0) {
    return true; // Sem filtro, passa tudo
  }

  const blockQuery = Array.isArray(block.query) ? block.query : [];

  return queries.some(query => {
    const filterFrom = query.filter(([k]) => k === 'from').map(([, v]) => v);
    const filterTo = query.filter(([k]) => k === 'to').map(([, v]) => v);

    const blockFrom = blockQuery.find(([k]) => k === 'from')?.[1];
    const blockTo = blockQuery.find(([k]) => k === 'to')?.[1];

    console.log('Filtrando bloco:', block.id);
    console.log('Block from:', blockFrom, 'Block to:', blockTo);
    console.log('Filter from:', filterFrom, 'Filter to:', filterTo);

    const fromMatch = filterFrom.length === 0 || (blockFrom && filterFrom.includes(blockFrom));
    const toMatch = filterTo.length === 0 || (blockTo && filterTo.includes(blockTo));

    console.log('Match from:', fromMatch, 'Match to:', toMatch);

    return fromMatch && toMatch;
  });
}

// Filtro por modo (create, delete, etc.)
function filterByMode(block, mode) {
    return mode ? block.mode === mode : true;
}

// Filtro por timestamp (desde)
function filterBySince(block, since) {
    return since ? block.created_at >= since : true;
}

// Filtro por timestamp (até)
function filterByUntil(block, until) {
    return until ? block.created_at <= until : true;
}

// Filtro por aplicativo
function filterByApp(block, app) {
    return app ? block.app === app : true;
}

// Filtro por ID
function filterById(block, id) {
    return id ? block.id === id : true;
}

// Filtro por consulta personalizada
function filterByQuery(block, query) {
    if (query && Array.isArray(query) && query.length > 0) {
        let parsedQuery = Array.isArray(block.query) ? block.query : [];
        return query.every(([key, value]) => 
            parsedQuery.some(([qKey, qValue]) => qKey === key && qValue === value)
        );
    }
    return true;
}

function filterByProfile(blocks) {
    let latestProfiles = new Map();

    blocks.forEach((block) => {
        // Se o pubkey ainda não está no mapa ou o bloco atual tem um created_at maior
        if (!latestProfiles.has(block.pubkey) || latestProfiles.get(block.pubkey).created_at < block.created_at) {
            latestProfiles.set(block.pubkey, block);
        }
    });

    return Array.from(latestProfiles.values());
}

// Exportando todas as funções
module.exports = {
    filterByPubkey,
    filterByMode,
    filterBySince,
    filterByUntil,
    filterByApp,
    filterById,
    filterByQuery,
    filterByProfile,
    filterByMessage
};