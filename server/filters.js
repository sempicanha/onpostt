// Filtro por chave pública
// function filterByPubkey(block, pubkey) {
//     return pubkey ? block.pubkey === pubkey : true;
// }

function filterByPubkey(block, pubkey) {
    // Verifica se há um recipient na query
    // const recipientQuery = block.query.find(item => item[0] === 'recipient');
    const recipientQuery = block.query ? block.query.find(item => item[0] === 'recipient') : null;

    // if(query.mode === 'message'){
        
    // }else{
    //     return pubkey ? block.pubkey === pubkey : true;
    // }
    return pubkey ? block.pubkey === pubkey : true;
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

// Filtro para "profile" - manter apenas o mais recente por chave pública
// function filterByProfile(blocks) {
//     let latestProfiles = new Map();

//     blocks.forEach((block) => {
//         if (!latestProfiles.has(block.pubkey)) {
//             latestProfiles.set(block.pubkey, block);
//         }
//     });

//     return Array.from(latestProfiles.values());
// }

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
    filterByProfile
};