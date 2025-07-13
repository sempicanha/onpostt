# Documentação do onpostt
# 📌 Protocolo Descentralizado por Relays Blocos sobre Blocos

Nosso protocolo é uma solução inovadora publicar e compartilhar blocos entre servers e relays onpostt - com foco em contruções de websites, chats, rede sociais no front-end, porém utilizando uma abordagem baseada em **Transmissão por Relays / Servers** e **Basic Blockchain** para redes sociais e outras aplicações. Os dados são armazenados em **blocos descentralizados**, assinados e criptografados com a chave privada do usuário.

---

## 🔹 Características Principais
✅ **Execução em Node.js**  
✅ **Uso de estrutura de Bancos de Dados como Postgree**  
✅ **Cada bloco é armazenado em como uma estrutura padrao individual**, contendo um ID e uma chave pública (**pubkey**) e a Assinatura do bloco 
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

```html
<script src="onpostt.min.js"></script>
```
## Introdução

`onpostt` é um objeto(lib) JavaScript que fornece funcionalidades para gerar chaves criptográficas, assinar blocos de dados e interagir com relays via WebSocket. Ele pode ser usado para criar posts, reações, seguir usuários, enviar mensagens e gerenciar perfis de forma segura.

## Funcionalidades Principais

- **Gerar chaves criptográficas** (privada e pública)
- **Assinar blocos de dados** para garantir autenticidade
- **Verificar assinaturas** de mensagens
- **Enviar blocos** para relays conectados
- **Subscrever a Blocos** de relays


### 2. Métodos

#### 2.1 Geração de Chaves

- `generateKeys()`: Retorna um par de chaves (privada e pública)
- `generateKeysCustom(input)`: Gera chaves a partir de uma string personalizada / use com cautela incluia dados unicos, como cidade, nome de animais favoritos, pessoas, data etc, evite nomes simplis, para evitar coliçoes na geração da chave cunstomizada 
- `generatePublicKey(privateKey)`: Obtém a chave pública de uma chave privada

#### 2.2 Assinatura e Verificação de Blocos

- `var BlockSigned = await onpostt.signBlock(block, privateKey)`: Assina um bloco e retorna a versão assinada
- `onpostt.sendBlock(BlockSigned, function(response){})`: Verifica se a assinatura de um bloco é válida.
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
Caso o Relay não não tenha websocket ativado você pode comentar o socket se voce é um ADM do servidor configure o .env de acordo com suas exigencias:

```javascript
const servers = {
  host: ["http://localhost:3000" ],
  socket: ["ws://localhost:3000" ]
};
```

### 2. Criar e Publicar um Bloco na rede.

```javascript
        async function post() {
            var privateKey = '21e28dfffa49daf6373527c579ee16dea1afd7c8a2f95d9eb2e6aeb0a8d6d3d2';
            var pubkey = onpostt.generatePublicKey(privateKey);  
        
            var block = {
                pubkey: pubkey,
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
        post()
```

### 3. Carregar Blocos

```javascript
        onpostt.list({
            mode: 'post',
            query: [["username", "lanpião.dev"]],
            app: "mariabonita.com.br",
            limit: 10,
            offset: 0
        }, function(handleEvent) {
            console.log('Eventos de lanpião.dev:', handleEvent);
        });
```

## Consultas avançadas usando os Parâmetros permitidos 
    Esta função busca blocos do tipo `post`, com suporte a filtros avançados via `query` e controle de paginação. os paramentros é valido para todos os modos, list, sub

##Parâmetros disponíveis
```javascript

    onpostt.list({
        mode: 'post', // Tipos permitidos: post, profile, like, follow, message, comment, delete
    
        // query: [
            ["username", "lanpião.dev"], //opcional depende de como você deseja consultar seus blocos
            ["site", "mariabonita.com.br"], //opcional depende de como você deseja consultar seus blocos

           ], // Filtro por campos específicos via 'query'
    
        // offset: 5, // Define a partir de qual posição os blocos serão carregados (útil para paginação)
        // limit: 10, // Limita a quantidade de blocos retornados (máximo pode ser definido pelo servidor)
    
        // since: 1752240053, // Retorna blocos com timestamp >= (created_at)
        // until: 1752240053, // Retorna blocos com timestamp <= (created_at)
    
        // app: "mariabonita.com.br", // Filtra blocos criados por um app específico
    }, function(handleEvent) {
        console.log('Todos Posts pela data:', handleEvent);
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

## Publicar ou Atualizar um Bloco do Tipo Perfil

    Ao publicar um bloco com `block.mode = 'profile'`, o novo bloco **não edita nem apaga** o anterior diretamente.  
    Em vez disso, ele **substitui** o bloco anterior na rede. Apenas o bloco mais recente é considerado válido,  
    enquanto os anteriores são automaticamente ignorados.

```javascript
    async function postProfile() {
        var privateKey = '21e28dfffa49daf6373527c579ee16dea1afd7c8a2f95d9eb2e6aeb0a8d6d3d2';
        var pubkey = onpostt.generatePublicKey(privateKey);  
    
        var block = {
            pubkey: pubkey,  // Chave pública do usuário
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

        onpostt.sendBlock(BlockSigned, function(response) {
            console.log('Resposta do relay:', response);
        });
    }
    postProfile()
```

## Buscar um Perfil na Rede
    Neste exemplo, a busca do perfil foi feita diretamente pela `pubkey`, sem o uso de `query`.  
    Apenas a chave pública do perfil foi utilizada para obter as informações.

```javascript
   onpostt.list({ 
        pubkey: '03dca175856ff79a1eb5d3b368b6840af29c38c36bf3291d07573ddcdf59110523',
        mode: 'profile', // Filtra por tipo de evento
        app: "mariabonita.com.br", // Filtra pelo nome do app
    }, function(handleEvent) {
        console.log('Profile', handleEvent);
    });
```

## Buscar um Perfil na Rede com Queries Avançadas
    Neste exemplo, utilizamos `query` para realizar buscas mais avançadas.  
    É importante sempre respeitar a estrutura do objeto `query` e utilizar apenas os valores permitidos para garantir uma consulta válida.
    
```javascript
   onpostt.list({
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

## Delete mode.
    Para deletar um bloco, é necessário usar a mesma chave privada que foi usada para assiná-lo. 
    privatekey: 21e28dfffa49daf6373527c579ee16dea1afd7c8a2f95d9eb2e6aeb0a8d6d3d2
    blockId: c8bbc08b4010c5fb2a093593216b79c74f2f56b287dd1c8e563776e32dcf84ed
    mode: 'delete'
```javascript
    
    //delete block
    async function deleteBlock() {
        var privateKey = '21e28dfffa49daf6373527c579ee16dea1afd7c8a2f95d9eb2e6aeb0a8d6d3d2';
        var pubkey = onpostt.generatePublicKey(privateKey);
        var blockId = 'c8bbc08b4010c5fb2a093593216b79c74f2f56b287dd1c8e563776e32dcf84ed'
    
        var block = {
            pubkey: pubkey,  
            mode: "delete", 
            query: [
                ["block", blockId]
            ]
            content: 'Block: '+ blockId, 
            app: 'mariabonita.com.br' 
        };
    
        // Assinar a requisição de deleção
        var signedDeleteRequest = await onpostt.signBlock(block, privateKey);

        console.log('Bloco de deleção assinado:', signedDeleteRequest);

        onpostt.sendBlock(signedDeleteRequest, function(response) {
            console.log('Resposta do servidor:', response);
        });
    }
    deleteBlock()

````



## Follow mode.
    Para seguir um bloco, envie sua pubkey no query `follower`
    e a pubkey do autor do bloco no query `following`.
     query: [
            ["follower", pubkey],
            ["following", pubkeyUser]
    ],
    mode: 'follow'
```javascript
    
    async function follow() {
        var privateKey = '21e28dfffa49daf6373527c579ee16dea1afd7c8a2f95d9eb2e6aeb0a8d6d3d2';
        var pubkey = onpostt.generatePublicKey(privateKey);  
        var pubkeyUser = '03a55933377c181548b8d22e6f5d4543a0a8f75cb55ae6e29d3653f9f38f627f93';
    
        var block = {
            pubkey: pubkey,  // Chave pública do usuário
            mode: "follow", // Tipo de evento (1 = Post)
            query: [
                    ["follower", pubkey],
                    ["following", pubkeyUser]
            ],
            content: 'following: '+ pubkeyUser, // Conteúdo da postagem
            app: 'mariabonita.com.br' // Nome do aplicativo que está publicando
        };
    
        var BlockSigned = await onpostt.signBlock(block, privateKey);
        console.log('Block Assinado:', BlockSigned);

        onpostt.sendBlock(BlockSigned, function(response) {
            console.log('Resposta do relay:', response);
        });
    }
    follow();
````


## Like mode.
    Like Post (bloco): passe o ID do bloco que deseja curtir.
    Ao publicar um bloco com o modo 'like', se ainda não houver um like seu, ele será adicionado.
    Caso já exista, o like será removido automaticamente, simplificando a lógica de alternância.
    
    query: [
            ["block", blockId]
    ],
    mode: 'like'
```javascript
    
    async function like() {
        var privateKey = '21e28dfffa49daf6373527c579ee16dea1afd7c8a2f95d9eb2e6aeb0a8d6d3d2';
        var pubkey = onpostt.generatePublicKey(privateKey);  
        var blockId = '6349eeab946cd1248674ef578dcbf585c2135f89c885106d1f72919fad70f2ac';
    
        var block = {
            pubkey: pubkey,  // Chave pública do usuário
            mode: "like", // Tipo de evento (1 = Post)
            query: [
                    ["block", blockId]
            ],
            content: 'liked: '+ blockId, // Conteúdo da postagem
            app: 'mariabonita.com.br' // Nome do aplicativo que está publicando
        };
    
        var BlockSigned = await onpostt.signBlock(block, privateKey);
        console.log('Block Assinado:', BlockSigned);

        onpostt.sendBlock(BlockSigned, function(response) {
            console.log('Resposta do relay:', response);
        });
    }
    like();
````


## Comment mode.
    Comenta em um bloco existente.
    Passe sua privateKey, o ID do bloco alvo (blockId) e o texto do comentário.
    O bloco será assinado e enviado automaticamente.
    
    query: [
            ["block", blockId]
    ],
    mode: 'comment'
```javascript
    
   async function comment() {
        var privateKey = '21e28dfffa49daf6373527c579ee16dea1afd7c8a2f95d9eb2e6aeb0a8d6d3d2';
        var pubkey = onpostt.generatePublicKey(privateKey);  
        var blockId = '6349eeab946cd1248674ef578dcbf585c2135f89c885106d1f72919fad70f2ac';
    
        var block = {
            pubkey: pubkey,  // Chave pública do usuário
            mode: "comment", 
            query: [
                    ["block", blockId]
            ],
            content: "Meu primeiro comentario.", // Conteúdo da postagem
            app: 'mariabonita.com.br' // Nome do aplicativo que está publicando
        };
    
        var BlockSigned = await onpostt.signBlock(block, privateKey);
        console.log('Block Assinado:', BlockSigned);

        onpostt.sendBlock(BlockSigned, function(response) {
            console.log('Resposta do relay:', response);
        });
    }
    comment();
````


## Message mode

    Permite enviar uma mensagem privada para um usuário utilizando sua `pubkey`.  
    Informe sua `privateKey`, a `pubkey` do destinatário e o conteúdo da mensagem.  
    O bloco será automaticamente assinado e enviado.
    
    ### Exemplo de `query`:
    
    query: [
        ["from", pubkey], // pubkey do remetente
        ["to", to]        // pubkey do destinatário
    ],
    mode: 'message'

```javascript

    async function postMessage() {
        const privateKey = '21e28dfffa49daf6373527c579ee16dea1afd7c8a2f95d9eb2e6aeb0a8d6d3d2';
        const pubkey = onpostt.generatePublicKey(privateKey);  
    
        const to = '03a55933377c181548b8d22e6f5d4543a0a8f75cb55ae6e29d3653f9f38f627f93';
    
        const block = {
            pubkey: pubkey,  // Chave pública do usuário
            mode: "message", // Tipo de evento (1 = Post)
            query: [
                ["from", pubkey], //pubkey do remetente
                ["to", to] //pubkey do distinatario
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
    postMessage()
   
````



## Listar Mensagens - Tipo `onpostt.sub`
    
> **Importante:** todas as mensagens são criptografadas por padrão.
    
    O método `onpostt.sub` carrega as mensagens em tempo real via WebSocket.  
    Se preferir carregar uma lista estática (sem tempo real), basta substituir `.sub` por `.list`.
    
    Para listar mensagens corretamente, é essencial adicionar uma `query` com sua `pubkey` como:
    - `from`: sua chave pública (remetente)
    - `to`: chave pública do destinatário
    
    
> No modo `.list`, os dados são retornados apenas uma vez via requisição HTTP — sem atualizações em tempo real.

    
    query: [
        ["from", '03dca175856ff79a1eb5d3b368b6840af29c38c36bf3291d07573ddcdf59110523'],
        ["to", '0248f402a6b74b3b4730203d9fe8b8e7307d545ae92c7efd3c65cd6451a940bcc0']
    ],
    mode: 'message'

## Criptografia de Mensagens
    Por padrão, todas as mensagens são criptografadas utilizando **criptografia assimétrica**.  
    Apenas o **remetente** e o **destinatário** conseguem descriptografá-las usando suas respectivas **chaves privadas**.
    
```javascript

    async function messageMaria(){
    var conversa = [];
    onpostt.sub({
        privatekey: '21e28dfffa49daf6373527c579ee16dea1afd7c8a2f95d9eb2e6aeb0a8d6d3d2',
        mode: 'message', // Filtra por tipo de evento
        pubkey: '03dca175856ff79a1eb5d3b368b6840af29c38c36bf3291d07573ddcdf59110523',
        query: [
            ["from", '03dca175856ff79a1eb5d3b368b6840af29c38c36bf3291d07573ddcdf59110523'],
            ["to", '0248f402a6b74b3b4730203d9fe8b8e7307d545ae92c7efd3c65cd6451a940bcc0']
        ],
        app: "mariabonita.com.br", // Filtra pelo nome do app
        
    }, async function(handleEvent) {
        console.log('messages maria', handleEvent);

        //Opcional
        
        //list todas as  mensagens
        const mensagensDescriptografadas = await onpostt.decryptMessages('21e28dfffa49daf6373527c579ee16dea1afd7c8a2f95d9eb2e6aeb0a8d6d3d2', handleEvent.blocks);
        mensagensDescriptografadas.forEach(msg => {
            if (msg !== null) console.log(msg);
        });

        //list a messagem mas recente 
        const mensagensDescriptografada = await onpostt.decryptMessage('21e28dfffa49daf6373527c579ee16dea1afd7c8a2f95d9eb2e6aeb0a8d6d3d2', handleEvent.blocks);
        console.log(mensagensDescriptografada)
       

    });
}
messageMaria();
   
````


## list comments blocks

    Esta função permite listar os comentários associados a um bloco específico na rede.

### Parâmetros principais:
    - `pubkey`: sua chave pública (opcional, para filtrar comentários relacionados).
    - `mode`: define o tipo de evento a ser filtrado. Aqui usamos `'comment'` para buscar apenas comentários.
    - `query`: permite especificar filtros avançados. No exemplo, filtramos os comentários pelo ID do bloco original (`block`).
    - `app`: filtra comentários publicados por um aplicativo específico (opcional).

### Funcionamento:
A função `onpostt.list` realiza uma requisição HTTP e retorna uma lista dos eventos que correspondem aos filtros aplicados. Diferente do `.sub`, essa função não recebe atualizações em tempo real.

### Exemplo de uso:

```javascript
    onpostt.list({
        pubkey: '03dca175856ff79a1eb5d3b368b6840af29c38c36bf3291d07573ddcdf59110523',
        mode: 'comment',
        query: [
            ["block", "6349eeab946cd1248674ef578dcbf585c2135f89c885106d1f72919fad70f2ac"]
        ],
        app: "mariabonita.com.br",
    }, function(handleEvent) {
        console.log('Comentário do bloco:', handleEvent);
    });
```


## list like Bloco blockId

Esta função lista todos os likes associados a um bloco específico na rede.

### Parâmetros principais:
    - `pubkey`: sua chave pública (opcional, usada para filtrar likes relacionados).
    - `mode`: define o tipo de evento a ser filtrado. Aqui usamos `'like'` para buscar apenas os likes.
    - `query`: permite filtrar eventos específicos. No exemplo, filtramos likes pelo ID do bloco alvo (`block`).
    - `app`: filtra likes publicados por um aplicativo específico (opcional).

### Funcionamento:
    A função `onpostt.list` faz uma requisição HTTP que retorna os eventos correspondentes aos filtros definidos.  
    Diferente do método `.sub`, ela não fornece atualizações em tempo real.

### Exemplo de uso:

```js
    onpostt.list({
        pubkey: '03dca175856ff79a1eb5d3b368b6840af29c38c36bf3291d07573ddcdf59110523',
        mode: 'like',
        query: [
            ["block", "6349eeab946cd1248674ef578dcbf585c2135f89c885106d1f72919fad70f2ac"]
        ],
        app: "mariabonita.com.br",
    }, function(handleEvent) {
        console.log('Likes do bloco:', handleEvent);
    });
```



## list Follows (Seguidores)

Esta função lista eventos do tipo `follow`, que representam ações de seguir perfis na rede.

### Parâmetros principais:
    - `pubkey`: sua chave pública (opcional, para filtrar eventos relacionados).
    - `mode`: define o tipo de evento a ser filtrado, aqui usado `'follow'`.
    - `query`: (opcional) permite filtros adicionais por múltiplas chaves, como `username` ou `site`.
    - `app`: filtra eventos publicados por um aplicativo específico (opcional).

### Funcionamento:
    A função `onpostt.list` realiza uma requisição HTTP e retorna os eventos que correspondem aos filtros aplicados.  
    Diferente do `.sub`, não há atualização em tempo real.
    
    ### Exemplo de uso:

```js
    onpostt.list({
        pubkey: '03dca175856ff79a1eb5d3b368b6840af29c38c36bf3291d07573ddcdf59110523',
        mode: 'follow',
        // query: [["username", "lanpião.dev2"], ["site", "mariabonita.com.br"]],
        app: "mariabonita.com.br",
    }, function(handleEvent) {
        console.log('Follows:', handleEvent);
    });
```

## Conclusão
O `onpostt` é uma biblioteca poderosa para interações seguras via WebSocket, Http, Https , permitindo criação de eventos autenticados e comunicação com relays de maneira confiável e descentralizada.


ajude o projeto pagando um café: 
bitcoin: bc1q8xfkw00elwcermnhqme7940x054g48l7p2kunp
ethereum: 0x81CA7554bDBCe86B3786eF44fdbf9992f09Ef68b
BCH: qqq5evh7xlg8mxxa8ez6u3zqz0vmytpv6q7vd8tq07
