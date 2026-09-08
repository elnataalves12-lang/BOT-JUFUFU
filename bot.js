// ==================== bot.js - GERENCIADOR DE CONEXÃO ====================
const path = require('path');
const fs = require('fs');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const P = require('pino');
const { Boom } = require('@hapi/boom');
const readline = require('readline');
const CONFIG = require('./config.js');

// ==================== VARIÁVEIS GLOBAIS ====================
let botStarted = false;
let pairingRequested = false;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
let reconnectTimeout = null;
let isReconnecting = false;
let sockInstance = null;
let healthCheckFailures = 0;
let lastPingSuccess = Date.now();

// ==================== PASTAS ====================
const PASTAS = {
    session: path.join(process.cwd(), 'session')
};

// Criar pasta session se não existir
if (!fs.existsSync(PASTAS.session)) {
    fs.mkdirSync(PASTAS.session, { recursive: true });
}

// ==================== FUNÇÕES AUXILIARES ====================
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function pergunta(perguntaText) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => {
        rl.question(perguntaText, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

// ==================== MANIPULADOR DE ERROS GLOBAL ====================
process.on('uncaughtException', (err) => {
    console.error('❌ Erro não tratado:', err.message);
    if (err.message?.includes('Connection') || 
        err.message?.includes('socket') ||
        err.message?.includes('ECONN') ||
        err.message?.includes('Timeout')) {
        console.log('🔄 Reiniciando por erro de conexão...');
        botStarted = false;
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }
        setTimeout(() => startBot().catch(console.error), 3000);
    }
});

process.on('unhandledRejection', (reason) => {
    console.error('❌ Promessa rejeitada:', reason);
    if (reason?.message?.includes('Connection') || 
        reason?.message?.includes('Timeout')) {
        console.log('🔄 Reiniciando por erro de conexão...');
        botStarted = false;
        setTimeout(() => startBot().catch(console.error), 3000);
    }
});

// ==================== HEALTH CHECK (VERSÃO SUAVE) ====================
function setupHealthCheck() {
    setInterval(() => {
        // 🔥 SÓ VERIFICA SE O SOCKET EXISTE
        if (!sockInstance) {
            console.log('⚠️ sockInstance é null');
            return;
        }
        
        if (!sockInstance.ws) {
            console.log('⚠️ ws é null');
            return;
        }
        
        try {
            const readyState = sockInstance.ws.readyState;
            
            // 🔥 CONEXÃO ABERTA - TUDO BEM
            if (readyState === 1) {
                lastPingSuccess = Date.now();
                healthCheckFailures = 0;
                return;
            }
            
            // 🔥 CONEXÃO FECHANDO OU FECHADA
            if (readyState === 2 || readyState === 3) {
                healthCheckFailures++;
                console.log(`⚠️ WebSocket estado: ${readyState} (falha ${healthCheckFailures}/3)`);
            }
            
            // 🔥 SÓ REINICIA APÓS 5 FALHAS (mais tolerante)
            if (healthCheckFailures >= 5) {
                console.log('⚠️ Conexão inativa. Reiniciando...');
                botStarted = false;
                isReconnecting = false;
                healthCheckFailures = 0;
                
                if (reconnectTimeout) {
                    clearTimeout(reconnectTimeout);
                    reconnectTimeout = null;
                }
                
                startBot().catch(console.error);
            }
            
        } catch (e) {
            console.log('⚠️ Erro no health check:', e.message);
            healthCheckFailures++;
            
            if (healthCheckFailures >= 5) {
                console.log('⚠️ Múltiplas falhas no health check. Reiniciando...');
                botStarted = false;
                isReconnecting = false;
                healthCheckFailures = 0;
                startBot().catch(console.error);
            }
        }
    }, 15000); // 🔥 A CADA 15 SEGUNDOS (em vez de 10)
}

// ==================== INICIAR BOT ====================
async function startBot() {
    if (botStarted) {
        console.log('⚠️ Bot já está rodando!');
        return sockInstance;
    }
    botStarted = true;

    try {
        console.log('📱 Carregando sessão...');
        const { state, saveCreds } = await useMultiFileAuthState(PASTAS.session);

        console.log('📱 Obtendo versão...');
        const { version } = await fetchLatestBaileysVersion();

        console.log('📱 Conectando ao WhatsApp...');

        const sock = makeWASocket({
            auth: state,
            version,
            logger: P({ level: "silent" }),
            browser: Browsers.ubuntu("Chrome"),
            syncFullHistory: false,
            generateHighQualityLinkPreview: false,
            defaultQueryTimeoutMs: 60000,
            printQRInTerminal: false
        });

        sockInstance = sock;
        sock.ev.on("creds.update", saveCreds);

        // ================================================================
        // 🔥 EVENTO DE CONEXÃO
        // ================================================================
        
        sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log('📌 QR Code gerado');
                return;
            }
            
if (connection === "open") {
    console.log(`\n✅ ${CONFIG.botNome} está ONLINE! 🚀`);
    console.log(`📅 ${new Date().toLocaleString()}\n`);
    
    connectionAttempts = 0;
    isReconnecting = false;
    botStarted = true;
    healthCheckFailures = 0;
    lastPingSuccess = Date.now();
    
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
    
    // 🔥 CHAMA O CALLBACK QUANDO O BOT ESTIVER ONLINE
    console.log('📌 Verificando onBotOnline...');
    console.log('📌 onBotOnline é:', typeof onBotOnline);
    
    if (typeof onBotOnline === 'function') {
        console.log('🔥 Chamando onBotOnline...');
        await onBotOnline(sock);
        console.log('✅ onBotOnline executado!');
    } else {
        console.log('❌ onBotOnline NÃO é uma função!');
        console.log('❌ Tipo:', typeof onBotOnline);
    }
    
    return;
}
            
            if (connection === "close") {
                const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
                console.log(`📊 Conexão fechada: ${statusCode || 'N/A'}`);
                
                // 🔥 IGNORA O CÓDIGO 440 (timeout normal)
                if (statusCode === 440) {
                    console.log('⏳ Timeout normal (440). Aguardando...');
                    return;
                }
                
                if (statusCode === DisconnectReason.loggedOut) {
                    console.log('❌ Logout detectado.');
                    console.log('📌 Apague a pasta session: rm -rf session/*');
                    botStarted = false;
                    pairingRequested = false;
                    return;
                }
                
                if (connectionAttempts < MAX_RECONNECT_ATTEMPTS && !isReconnecting) {
                    isReconnecting = true;
                    connectionAttempts++;
                    
                    const waitTime = Math.min(5000 * Math.pow(1.5, connectionAttempts - 1), 60000);
                    
                    console.log(`🔄 Reconectando... (${connectionAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
                    console.log(`⏱️ Aguardando ${(waitTime/1000).toFixed(1)}s...`);
                    
                    if (sockInstance) {
                        try {
                            await sockInstance.ws?.close();
                        } catch (e) {}
                        sockInstance = null;
                    }
                    
                    if (reconnectTimeout) {
                        clearTimeout(reconnectTimeout);
                        reconnectTimeout = null;
                    }
                    
                    reconnectTimeout = setTimeout(() => {
                        isReconnecting = false;
                        botStarted = false;
                        reconnectTimeout = null;
                        startBot().catch(console.error);
                    }, waitTime);
                    
                } else if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
                    console.log('❌ Máximo de tentativas.');
                    botStarted = false;
                    isReconnecting = false;
                    
                    setTimeout(() => {
                        connectionAttempts = 0;
                        botStarted = false;
                        startBot().catch(console.error);
                    }, 300000);
                }
            }
        });

        // ================================================================
        // 🔥 PAIRING CODE
        // ================================================================
        
        if (!pairingRequested && !sock.authState.creds.registered) {
            pairingRequested = true;
            
            await delay(1000);
            
            const numero = await pergunta('👉 Digite seu número (ex: 5599999999999): ');
            
            if (numero && numero.trim()) {
                try {
                    console.log('📱 Solicitando código de pareamento...');
                    const code = await sock.requestPairingCode(numero.trim());
                    const formatted = code.match(/.{1,4}/g)?.join('-') || code;
                    console.log('\n📱 CÓDIGO DE PAREAMENTO:');
                    console.log(`👉 ${formatted}\n`);
                    console.log('✅ Abra o WhatsApp no CELULAR:');
                    console.log('   1. 3 pontinhos → Dispositivos vinculados');
                    console.log('   2. Vincular um dispositivo');
                    console.log('   3. "Vincular com número de telefone"');
                    console.log('   4. Cole o código acima AGORA!');
                    console.log('\n⏳ Aguardando conexão...');
                } catch (err) {
                    console.log('❌ Erro ao gerar código:', err.message);
                    pairingRequested = false;
                    botStarted = false;
                    setTimeout(startBot, 3000);
                }
            } else {
                console.log('❌ Número não informado. Tentando novamente...');
                pairingRequested = false;
                botStarted = false;
                setTimeout(startBot, 3000);
            }
        }

        // ================================================================
        // 🔥 HEALTH CHECK
        // ================================================================
        
        setupHealthCheck();

        // 🔥 RETORNA O SOCKET
        return sock;

    } catch (err) {
        console.error('❌ Erro ao iniciar bot:', err.message);
        botStarted = false;
        isReconnecting = false;
        
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }
        
        setTimeout(() => {
            startBot().catch(console.error);
        }, 5000);
    }
}

// ==================== FUNÇÃO PARA OBTER O SOCKET ====================
function getSocket() {
    return sockInstance;
}

// ==================== FUNÇÃO PARA VERIFICAR SE ESTÁ CONECTADO ====================
function isConnected() {
    if (!sockInstance) return false;
    if (!sockInstance.ws) return false;
    if (sockInstance.ws.readyState !== 1) return false;
    return true;
}

// ==================== CALLBACK (será definido no index.js) ====================
// ==================== CALLBACK (será definido no index.js) ====================
let onBotOnline = null;

// ==================== EXPORTAR ====================
module.exports = {
    startBot,
    getSocket,
    isConnected,
    PASTAS,
    setOnBotOnline: function(callback) {
        onBotOnline = callback;
        console.log('✅ setOnBotOnline registrado com sucesso!');
    }
};