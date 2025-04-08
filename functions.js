//delete block
async function deletes() {
    var privateKey = '21e28dfffa49daf6373527c579ee16dea1afd7c8a2f95d9eb2e6aeb0a8d6d3d2';
    var pubkey = onpostt.generatePublicKey(privateKey);  
    console.log(pubkey)
    var deleteRequest = {
        pubkey: pubkey,  
        created_at: Math.floor(Date.now() / 1000), 
        mode: "delete", 
        blockId: "c8bbc08b4010c5fb2a093593216b79c74f2f56b287dd1c8e563776e32dcf84ed",
        content: 'Bloco Deletado', 
        app: 'mariabonita.com.br' 
    };

    // Assinar a requisição de deleção
    var signedDeleteRequest = await onpostt.signBlock(deleteRequest, privateKey);
    
    console.log('Bloco de deleção assinado:', signedDeleteRequest);

    // Enviar para o servidor via WebSocket
    onpostt.sendBlock(signedDeleteRequest, function(response) {
        console.log('Resposta do servidor:', response);
    });
}