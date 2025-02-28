# Documentação do onpostt
# 📌 Protocolo Descentralizado (Nome Confidencial)

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

```html
<script src="onpostt.min.js"></script>

## Introdução

`onpostt` é um objeto JavaScript que fornece funcionalidades para gerar chaves criptográficas, assinar blocos de dados e interagir com relays via WebSocket. Ele pode ser usado para criar posts, reações, seguir usuários, enviar mensagens e gerenciar perfis de forma segura.

## Funcionalidades Principais

- **Gerar chaves criptográficas** (privada e pública)
- **Assinar blocos de dados** para garantir autenticidade
- **Verificar assinaturas** de mensagens
- **Enviar blocos** para relays conectados
- **Subscrever a eventos** de relays

## Estrutura do Objeto `onpostt`

### 1. Propriedades

- `callbacks`: Array para armazenar callbacks
- `data`: Array para armazenar dados
- `sockets`: Array para gerenciar conexões WebSocket
- `isConnected`: Booleano que indica conexão ativa
- `callbacksQueue`: Fila de callbacks pendentes
- `ec`: Instância da curva elíptica secp256k1 para criptografia

### 2. Métodos

#### 2.1 Geração de Chaves

- `generateKeys()`: Retorna um par de chaves (privada e pública)
- `generateKeysCustom(input)`: Gera chaves a partir de uma string personalizada
- `generatePublicKey(privateKey)`: Obtém a chave pública de uma chave privada

#### 2.2 Assinatura e Verificação de Blocos

- `signBlock(block, privateKey)`: Assina um bloco e retorna a versão assinada
- `verifySignature(publicKeyHex, message, signature)`: Verifica se a assinatura de um bloco é válida

#### 2.3 Função Hash (SHA-256)

- `sha256(message)`: Retorna o hash SHA-256 de uma mensagem

#### 2.4 Conexão com Relays

- `connect(hosts)`: Estabelece conexão com uma lista de relays via WebSocket
- `createConnection(host, onConnectedCallback)`: Conecta-se a um relay específico

#### 2.5 Envio e Recebimento de Blocos

- `sendBlock(block, callbacks)`: Envia um bloco assinado para os relays conectados
- `isValidJsonObject(obj)`: Verifica se um objeto JSON é válido
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

### 2. Criar e Enviar um Post

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

### 3. Subscrever a Eventos

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


## Conclusão

O `onpostt` é uma biblioteca poderosa para interações seguras via WebSocket, permitindo criação de eventos autenticados e comunicação com relays de maneira confiável e descentralizada.
