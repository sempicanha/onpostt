# Documentação do onpostt
# 📌 Protocolo Descentralizado por Relays Blocos sobre Blocos

Nosso protocolo é uma solução inovadora semelhante à rede Bitcoin, porém utilizando uma abordagem baseada em **Transmissão por Relays** e **Basic Blockchain** para redes sociais e outras aplicações. Os dados são armazenados em **blocos descentralizados**, assinados e criptografados com a chave privada do usuário.

---

## 🔹 Características Principais
✅ **Execução em Node.js**  
✅ **Uso de estrutura JSON em vez de banco de dados tradicional**  
✅ **Cada bloco é armazenado em um arquivo `.json` individual**, contendo um ID e uma chave pública (**pubkey**)  
✅ **Consultas organizadas** com querys, filtros e parâmetros personalizados  
✅ **Altamente escalável**  
✅ **Baseado em WebSocket e comunicação P2P**  

---

## 🔒 Segurança e Privacidade

🔹 **Criptografia baseada em chaves privadas**, garantindo total controle do usuário sobre seus dados  
🔹 **Descentralização** → resistência à censura e **eliminação de pontos únicos de falha**  
🔹 **Assinaturas digitais** garantem que cada bloco é autêntico e inviolável  

---

## 📈 Escalabilidade e Flexibilidade

💡 **Estrutura modular baseada em JSON** permite fácil integração com outras tecnologias  
💡 **Crescimento escalável sem comprometer a eficiência**  
💡 **Compatível com múltiplos relays WebSocket simultaneamente**  

---

## 🔗 Importação da Biblioteca `onpostt.min.js`

Para utilizar o protocolo, inclua a seguinte biblioteca no seu projeto:

<script src="onpostt.min.js"></script>

## Introdução

`onpostt` é um objeto JavaScript que fornece funcionalidades para gerar chaves criptográficas, assinar blocos de dados e interagir com relays via WebSocket. Ele pode ser usado para criar posts, reações, seguir usuários, enviar mensagens e gerenciar perfis de forma segura.

## Funcionalidades Principais

- **Gerar chaves criptográficas** (privada e pública)
- **Assinar blocos de dados** para garantir autenticidade
- **Verificar assinaturas** de mensagens
- **Enviar blocos** para relays conectados
- **Subscrever a Blocos** de relays


### 2. Métodos

#### 2.1 Geração de Chaves

- `generateKeys()`: Retorna um par de chaves (privada e pública)
- `generateKeysCustom(input)`: Gera chaves a partir de uma string personalizada
- `generatePublicKey(privateKey)`: Obtém a chave pública de uma chave privada

#### 2.2 Assinatura e Verificação de Blocos

- `signBlock(block, privateKey)`: Assina um bloco e retorna a versão assinada
- `verifySignature(publicKeyHex, message, signature)`: Verifica se a assinatura de um bloco é válida.
#### 2.4 Conexão com Relays

- `connect(hosts)`: Estabelece conexão com uma lista de relays via WebSocket

#### 2.5 Envio e Recebimento de Blocos

- `sendBlock(block, callbacks)`: Envia um bloco assinado para os relays conectados
- `sub(filters, callbacks)`: Subscreve-se a eventos conforme os filtros fornecidos

### 3. Criação de Blocos Específicos

- `createPost(content, privateKey, app)`: Cria um bloco de post
- `createReaction(emoji, ref, privateKey, app)`: Cria um bloco de reação
- `createFollow(followedPubkey, privateKey, app)`: Cria um bloco de follow
- `createMessage(message, recipientPubkey, privateKey, app)`: Cria um bloco de mensagem privada
- `createProfile(profileData, privateKey, app)`: Cria um bloco de perfil
- `createFollowing(privateKey, app)`: Cria um bloco de seguidores

## Exemplo de Uso

### 1. Conectar-se a um Relay

```javascript
var connect = onpostt.connect(['ws://localhost:3000']);
```

### 2. Criar e Publicar um Bloco na rede.

```javascript
async function post() {
    var privateKey = '21e28dfffa49daf6373527c579ee16dea1afd7c8a2f95d9eb2e6aeb0a8d6d3d2';
    var pubkey = onpostt.generatePublicKey(privateKey);  

    var block = {
        pubkey: pubkey,
        created_at: Math.floor(Date.now() / 1000),
        mode: "post",
        query: [
            ["username", "lanpião.dev"],
            ["site", "google.com"]
        ],
        content: 'Rei do Cangaço',
        app: 'mariabonita.com.br'
    };

    var BlockSigned = await onpostt.signBlock(block, privateKey);
    console.log('Block Assinado:', BlockSigned);
    onpostt.sendBlock(BlockSigned, function(response) {
        console.log('Resposta do relay:', response);
    });
}
```

### 3. Subscrever a Blocos

```javascript
onpostt.sub({
    mode: 'post',
    query: [["username", "lanpião.dev"]],
    app: "mariabonita.com.br",
    limit: 10,
    offset: 0
}, function(handleEvent) {
    console.log('Eventos de lanpião.dev:', handleEvent);
});
```

# 🔹 Exemplos de Saída do Sistema

## 📌 Exemplo de Saída de um Bloco Assinado (`signBlock`)
```json
{
  "pubkey": "03dca175856ff79a1eb5d3b368b6840af29c38c36bf3291d07573ddcdf59110523",
  "created_at": 1700000000,
  "mode": "post",
  "query": [
    ["username", "lanpião.dev"],
    ["site", "google.com"]
  ],
  "content": "Rei do Cangaço",
  "app": "mariabonita.com.br",
  "id": "91707575e4b2b325a67b03a57a8bf1218c7b7ac7399ac5705af5c21dca8de18a",
  "sig": "3045022100f0c64e3f9c07b9b1e832ecc06dfd041e0..."
}
```

## Publicar ou atualizar um Bloco do tipo Perfil na rede
Sempre que um bloco com block.mode = 'profile' é publicado, ele não apaga nem edita o bloco anterior, mas sim o substitui na rede. O bloco mais recente toma o lugar do anterior, sendo o único reconhecido como válido, enquanto os blocos anteriores são ignorados.

```javascript
    async function postProfile() {
        var privateKey = '21e28dfffa49daf6373527c579ee16dea1afd7c8a2f95d9eb2e6aeb0a8d6d3d2';
        var pubkey = onpostt.generatePublicKey(privateKey);  
    
        var block = {
            pubkey: pubkey,  // Chave pública do usuário
            created_at: Math.floor(Date.now() / 1000), // Timestamp atual
            mode: "profile", // Tipo de evento (1 = Post)
            content: {
                name: 'Jackson Santos devs s',
                picture: 'https://i.etsystatic.com/39063034/r/il/89f3fe/5287734117/il_570xN.5287734117_5dus.jpg',
                about: 'Sou Dev JS'
            }, // Conteúdo da postagem
            query:[],
            app: 'mariabonita.com.br' // Nome do aplicativo que está publicando
        };
    
        var BlockSigned = await onpostt.signBlock(block, privateKey);
        console.log('Block Assinado:', BlockSigned);
        // BlockSigned.content = 'oalr'
        onpostt.sendBlock(BlockSigned, function(response) {
            console.log('Resposta do relay:', response);
        });
    }
    postProfile()
```

## Buscar um Perfil na rede

```javascript
   onpostt.sub({ 
        pubkey: '03dca175856ff79a1eb5d3b368b6840af29c38c36bf3291d07573ddcdf59110523',
        mode: 'profile', // Filtra por tipo de evento
        app: "mariabonita.com.br", // Filtra pelo nome do app
    }, function(handleEvent) {
        console.log('Profile', handleEvent);
    });

    
```

## Buscar um Perfil na rede usando querys para consultas avançadas.

```javascript
   onpostt.sub({
        pubkey: '03dca175856ff79a1eb5d3b368b6840af29c38c36bf3291d07573ddcdf59110523',
        mode: 'profile', // Filtra por tipo de evento
        query: [
            ["username", "lanpião.dev"],
            ["site", "google.com"]
        ], // Filtra por múltiplas chaves no campo 'query'
        app: "mariabonita.com.br" // Filtra pelo nome do app
    }, function(handleEvent) {
        console.log('Profile querys', handleEvent);
    });
```

## Enviar uma mensagem para um usuário utilizando sua chave pública (pubkey).

```javascript
    async function postMessage() {
        const privateKey = '21e28dfffa49daf6373527c579ee16dea1afd7c8a2f95d9eb2e6aeb0a8d6d3d2';
        const pubkey = onpostt.generatePublicKey(privateKey);  
    
        const recipient = '03a55933377c181548b8d22e6f5d4543a0a8f75cb55ae6e29d3653f9f38f627f93';
    
        const block = {
            pubkey: pubkey,  // Chave pública do usuário
            created_at: Math.floor(Date.now() / 1000), // Timestamp atual
            mode: "message", // Tipo de evento (1 = Post)
            query: [
                ["sender", pubkey], //pubkey do remetente
                ["recipient", recipient] //pubkey do distinatario
            ],
            content: 'Ja Baixou o código que te passei?', // Conteúdo da postagem
            app: 'mariabonita.com.br' // Nome do aplicativo que está publicando
        };
    
        const BlockSigned = await onpostt.signBlock(block, privateKey);
        console.log('Block Assinado:', BlockSigned);
        // BlockSigned.content = 'oalr'
        onpostt.sendBlock(BlockSigned, function(response) {
            console.log('Resposta do relay:', response);
        });
    }

```

## Consultar as mensagens um usuario atraves de sua PrivateKey.
Apenas o usuário que possui a sua chave privada tem acesso às suas mensagens. Cada mensagem é assinada digitalmente e pode ser verificada utilizando a chave pública do autor, garantindo autenticidade e segurança. Esse processo ocorre tanto no cliente quanto no servidor.

```javascript
   onpostt.sub({
        privatekey: '21e28dfffa49daf6373527c579ee16dea1afd7c8a2f95d9eb2e6aeb0a8d6d3d2',
        mode: 'message', // Filtra por tipo de evento
        query: [
            ["sender", '03dca175856ff79a1eb5d3b368b6840af29c38c36bf3291d07573ddcdf59110523'], //pubkey do remetente
            ["recipient", '03a55933377c181548b8d22e6f5d4543a0a8f75cb55ae6e29d3653f9f38f627f93'] //pubkey do distinatario
        ],
        app: "mariabonita.com.br"// Filtra pelo nome do app
    }, function(handleEvent) {
        console.log('ChatMessage_03dca175856ff', handleEvent);
    });

```
##deletar um bloco.
    Para deletar um bloco só é possivel passando a chave privada usada para assinar o bloco 
    privatekey: 21e28dfffa49daf6373527c579ee16dea1afd7c8a2f95d9eb2e6aeb0a8d6d3d2
    blockId: c8bbc08b4010c5fb2a093593216b79c74f2f56b287dd1c8e563776e32dcf84ed
    mode: 'delete'
```javascript
    
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


````

## Conclusão
O `onpostt` é uma biblioteca poderosa para interações seguras via WebSocket, permitindo criação de eventos autenticados e comunicação com relays de maneira confiável e descentralizada.


ajude o projeto pagando um café: 
bitcoin: bc1q8xfkw00elwcermnhqme7940x054g48l7p2kunp
ethereum: 0x81CA7554bDBCe86B3786eF44fdbf9992f09Ef68b
BCH: qqq5evh7xlg8mxxa8ez6u3zqz0vmytpv6q7vd8tq07
