// ============================================================
//  JUFUFU BOT • CONEXÃO COM O APP DE MENUS
//  Arquivo: services/menus.js
// ============================================================

const fetch = require('node-fetch');

// ============================================================
// CONFIGURAÇÃO
// ============================================================

const APP_URL = 'https://quick-menu-bot.lovable.app';
const APP_TOKEN = '70c7c1bcc8d44d9a9e0a58aac9eb7492';

const MENUS = ['menu', 'menus', 'menuadm', 'menubrincadeira', 'menudono'];

// ============================================================
//  DADOS DO BOT VINDOS DO SEU config.js
// ============================================================

function carregarConfigDoBot() {
    const caminhos = [
        '../config.js',
        '../config',
        './config.js',
        './config',
        '../../config.js',
        '../../config',
        '../settings.js',
        '../settings'
    ];
    
    for (const c of caminhos) {
        try {
            const m = require(c);
            if (m && typeof m === 'object') {
                console.log(`✅ Config carregado de: ${c}`);
                return m.default || m;
            }
        } catch (_) {}
    }
    console.log('⚠️ Nenhum config encontrado, usando valores padrão');
    return {};
}

const CFG_BOT = carregarConfigDoBot();

function primeiro(...valores) {
    for (const v of valores) {
        if (v === undefined || v === null) continue;
        const s = Array.isArray(v) ? String(v[0] ?? '') : String(v);
        if (s.trim()) return s.trim();
    }
    return '';
}

function dadosDoBot() {
    const d = {
        bot: primeiro(CFG_BOT.botNome, CFG_BOT.nomeBot, CFG_BOT.nomedobot, CFG_BOT.nomeDoBot, CFG_BOT.botName, CFG_BOT.nome),
        dono: primeiro(CFG_BOT.donoOriginal, CFG_BOT.numerodono, CFG_BOT.numeroDono, CFG_BOT.donoNumero, CFG_BOT.dono, CFG_BOT.owner, CFG_BOT.ownerNumber, CFG_BOT.numeroOwner),
        prefix: primeiro(CFG_BOT.prefix, CFG_BOT.prefixo),
        versao: primeiro(CFG_BOT.versao, CFG_BOT.version),
        contato: primeiro(CFG_BOT.contato, CFG_BOT.suporte, CFG_BOT.numerodono, CFG_BOT.dono, CFG_BOT.owner)
    };
    
    console.log('📋 Dados do bot carregados:', d);
    return d;
}

function paramsDoBot() {
    const d = dadosDoBot();
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(d)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? '&' + s : '';
}

// ============================================================
// HELPERS
// ============================================================

const TENTATIVAS = 4;
const ESPERA_BASE = 800;

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function comRetry(nome, fn, tentativas = TENTATIVAS) {
    let ultimoErro;
    for (let i = 1; i <= tentativas; i++) {
        try {
            return await fn(i);
        } catch (e) {
            ultimoErro = e;
            console.log(`⚠️ ${nome} falhou (tentativa ${i}/${tentativas}): ${e.message}`);
            if (i < tentativas) await dormir(ESPERA_BASE * i);
        }
    }
    throw ultimoErro;
}

async function api(caminho, opcoes = {}, tentativas = TENTATIVAS) {
    if (!APP_URL || APP_URL.includes('COLE_A_URL')) throw new Error('URL do aplicativo não configurada');
    if (!APP_TOKEN || APP_TOKEN.includes('COLE_O_TOKEN')) throw new Error('Token do aplicativo não configurado');
    
    const base = APP_URL.replace(/\/$/, '');
    const url = `${base}${caminho}${caminho.includes('?') ? '&' : '?'}token=${encodeURIComponent(APP_TOKEN)}`;
    
    return comRetry(`API ${caminho}`, async () => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);
        try {
            const res = await fetch(url, { ...opcoes, signal: controller.signal });
            const texto = await res.text();
            let dados;
            try { dados = JSON.parse(texto); } catch (_) {
                throw new Error(`API retornou resposta inválida (${res.status})`);
            }
            if (!res.ok) throw new Error(dados.error || `API retornou erro ${res.status}`);
            return dados;
        } finally {
            clearTimeout(timer);
        }
    }, tentativas);
}

async function registrarLog(dados) {
    try {
        await api('/api/public/bot/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: APP_TOKEN, ...dados })
        }, 1);
    } catch (_) {}
}

async function enviarComRetry(sock, chat, conteudo, opcoes, descricao) {
    return comRetry(`envio ${descricao}`, () => sock.sendMessage(chat, conteudo, opcoes));
}

async function baixar(url) {
    return comRetry('download de mídia', async () => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`falha ao baixar mídia (${res.status})`);
        return Buffer.from(await res.arrayBuffer());
    });
}

async function reagir(sock, chat, id, emoji) {
    try {
        await sock.sendMessage(chat, { react: { text: emoji, key: { remoteJid: chat, id } } });
    } catch (e) {}
}

// ============================================================
// CACHE DE MÍDIA
// ============================================================

const CACHE_MS = 60000;
const _cacheMidia = new Map();

async function baixarCache(url) {
    const hit = _cacheMidia.get(url);
    if (hit && Date.now() - hit.t < CACHE_MS) return hit.buffer;
    const buffer = await baixar(url);
    _cacheMidia.set(url, { t: Date.now(), buffer });
    return buffer;
}

// ============================================================
// PRÉ-AQUECIMENTO
// ============================================================

async function preAquecer() {
    try {
        console.log('🔥 Pré-aquecendo menus...');
        const d = await api('/api/public/bot/menu?menu=menu&user=0' + paramsDoBot(), {}, 1);
        if (d && d.ok) {
            if (d.audio) baixarCache(d.audio).catch(() => {});
            if (d.media && d.media.url) baixarCache(d.media.url).catch(() => {});
            console.log('✅ Menu pré-aquecido com sucesso!');
        }
    } catch (_) {
        console.log('⚠️ Pré-aquecimento falhou, mas o bot vai tentar novamente quando necessário');
    }
}

// ============================================================
// ENVIA QUALQUER MENU
// ============================================================

const ESPERA_CARREGANDO = 1500;

async function enviarMenuApp(chave, chat, sock, msg) {
    const sender = msg.key.participant || msg.key.remoteJid;
    const numero = sender.split('@')[0];

    let dados;
    try {
        dados = await api(`/api/public/bot/menu?menu=${chave}&user=${numero}${paramsDoBot()}`);
    } catch (e) {
        console.error('❌ App de menus offline:', e.message);
        registrarLog({ tipo: 'envio', menu: chave, usuario: numero, ok: false, mensagem: 'Bot não conseguiu buscar o menu: ' + e.message });
        try {
            await sock.sendMessage(chat, { text: `❌ Não consegui buscar o menu no aplicativo: ${e.message}` }, { quoted: msg });
        } catch (_) {}
        return;
    }
    
    if (!dados || !dados.ok) {
        console.error('❌ Erro do app de menus:', dados && dados.error);
        try {
            await sock.sendMessage(chat, { text: `❌ Erro ao carregar o menu: ${(dados && dados.error) || 'resposta inválida'}` }, { quoted: msg });
        } catch (_) {}
        return;
    }

    // 1) Começa a baixar áudio e mídia EM PARALELO
    const pAudio = dados.audio ? baixarCache(dados.audio).catch(() => null) : Promise.resolve(null);
    const pMidia = (dados.media && dados.media.url)
        ? baixarCache(dados.media.url).then((b) => ({ tipo: dados.media.gif ? 'video' : 'image', buffer: b })).catch(() => null)
        : Promise.resolve(null);

    // 2) Mensagem de "carregando" imediata
    const inicio = Date.now();
    let sentMsg = null;
    try {
        sentMsg = await sock.sendMessage(chat, { text: dados.inicial, mentions: [sender] }, { quoted: msg });
    } catch (_) {}

    // 3) Áudio (PTT) assim que estiver pronto
    const envioAudio = (async () => {
        const buffer = await pAudio;
        if (!buffer) return;
        try {
            await enviarComRetry(sock, chat, { audio: buffer, mimetype: 'audio/mp4', ptt: true }, { quoted: msg }, 'áudio do menu');
        } catch (e) {
            console.log('⚠️ Erro no áudio do menu:', e.message);
        }
    })();

    const midia = await pMidia;

    const enviar = async (texto) => {
        if (midia && midia.tipo === 'video') {
            return enviarComRetry(sock, chat, {
                video: midia.buffer,
                caption: texto,
                gifPlayback: true,
                mentions: [sender]
            }, { quoted: msg }, 'menu em vídeo/GIF');
        }
        if (midia) {
            return enviarComRetry(sock, chat, {
                image: midia.buffer,
                caption: texto,
                mentions: [sender]
            }, { quoted: msg }, 'menu com foto');
        }
        return enviarComRetry(sock, chat, { text: texto, mentions: [sender] }, { quoted: msg }, 'menu em texto');
    };

    // 4) Espera o resto do tempinho de "carregando"
    const restante = ESPERA_CARREGANDO - (Date.now() - inicio);
    if (restante > 0) await dormir(restante);
    await envioAudio;

    try {
        if (sentMsg && sentMsg.key) sock.sendMessage(chat, { delete: sentMsg.key }).catch(() => {});
        await enviar(dados.completo);
        registrarLog({ tipo: 'envio', menu: chave, usuario: numero, ok: true, mensagem: 'Menu enviado no WhatsApp com sucesso.' });
    } catch (e) {
        try {
            await enviarComRetry(sock, chat, { text: dados.completo, mentions: [sender] }, { quoted: msg }, 'menu (texto de emergência)');
            registrarLog({ tipo: 'envio', menu: chave, usuario: numero, ok: true, mensagem: 'Menu enviado em texto após falha na mídia: ' + e.message });
        } catch (e2) {
            registrarLog({ tipo: 'envio', menu: chave, usuario: numero, ok: false, mensagem: 'Falha ao enviar o menu no WhatsApp: ' + e2.message });
        }
    }
}

// ============================================================
// COMANDOS DE MÍDIA (SOMENTE DONO)
// ============================================================

async function salvarMidiaDoApp(tipo, buffer, mime, duracao) {
    return api('/api/public/bot/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            token: APP_TOKEN,
            tipo,
            mime,
            duracao,
            base64: buffer.toString('base64')
        })
    });
}

async function cmdSetMidia(tipo, sock, chat, sender, msg, enviarResposta, downloadMediaMessage, P, isDono) {
    if (!(await isDono(sender))) {
        await enviarResposta(chat, sock, '🔒 Apenas o dono do bot pode usar este comando!', msg);
        return;
    }

    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const alvoMsg = tipo === 'image' ? quoted?.imageMessage
        : tipo === 'video' ? quoted?.videoMessage
        : (quoted?.audioMessage || quoted?.videoMessage);

    if (!quoted || !alvoMsg) {
        const dica = tipo === 'image' ? '🖼️ Responda uma FOTO com esse comando'
            : tipo === 'video' ? '📹 Responda um VÍDEO (até 20s) com esse comando'
            : '🎵 Responda um ÁUDIO com esse comando';
        await enviarResposta(chat, sock, dica, msg);
        return;
    }

    if (tipo === 'video' && alvoMsg.seconds && alvoMsg.seconds > 20) {
        await enviarResposta(chat, sock, '⏱️ O vídeo do menu pode ter no máximo 20 segundos!', msg);
        return;
    }

    await reagir(sock, chat, msg.key.id, '⏳');
    try {
        const buffer = await downloadMediaMessage({ message: quoted, key: msg.key }, 'buffer', {}, { logger: P({ level: 'silent' }) });
        const resp = await salvarMidiaDoApp(tipo, buffer, alvoMsg.mimetype, alvoMsg.seconds);
        if (!resp.ok) throw new Error(resp.error || 'erro no app');

        const nome = tipo === 'image' ? 'Foto' : tipo === 'video' ? 'Vídeo (GIF)' : 'Áudio';
        await enviarResposta(chat, sock, `✅ ${nome} do menu atualizado! Já vale para TODOS os menus do bot.`, msg);
        await reagir(sock, chat, msg.key.id, '✅');
    } catch (e) {
        await enviarResposta(chat, sock, `❌ Erro: ${e.message}`, msg);
        await reagir(sock, chat, msg.key.id, '❌');
    }
}

async function cmdResetMenu(sock, chat, sender, msg, enviarResposta, isDono) {
    if (!(await isDono(sender))) {
        await enviarResposta(chat, sock, '🔒 Apenas o dono do bot pode usar este comando!', msg);
        return;
    }
    const resp = await api('/api/public/bot/media', { method: 'DELETE' });
    await enviarResposta(chat, sock, resp.ok ? '🗑️ Menu resetado! Foto, vídeo e áudio removidos.' : `❌ ${resp.error}`, msg);
}

// ============================================================
// ROTEADOR ÚNICO
// ============================================================

async function tratarComandoMenu(ctx) {
    const { comando, chat, sock, msg, sender, enviarResposta, verificarAdmin, isDono, downloadMediaMessage, P } = ctx;
    const cmd = String(comando || '')
        .trim()
        .toLowerCase()
        .replace(/^[°!\/.#$%&*]+/, '');

    if (cmd === 'setmenuimage') { await cmdSetMidia('image', sock, chat, sender, msg, enviarResposta, downloadMediaMessage, P, isDono); return true; }
    if (cmd === 'setmenuview' || cmd === 'setmenuvideo') { await cmdSetMidia('video', sock, chat, sender, msg, enviarResposta, downloadMediaMessage, P, isDono); return true; }
    if (cmd === 'setmenuaudio' || cmd === 'setmenuaudiodono') { await cmdSetMidia('audio', sock, chat, sender, msg, enviarResposta, downloadMediaMessage, P, isDono); return true; }
    if (cmd === 'resetmenu') { await cmdResetMenu(sock, chat, sender, msg, enviarResposta, isDono); return true; }

    if (!MENUS.includes(cmd)) return false;

    if (cmd === 'menudono' && !(await isDono(sender))) {
        await enviarResposta(chat, sock, '🔒 SOMENTE O DONO pode abrir esse menu!', msg);
        return true;
    }
    if (cmd === 'menuadm') {
        const admin = await verificarAdmin(sock, chat, sender);
        const dono = await isDono(sender);
        if (!admin && !dono) {
            await enviarResposta(chat, sock, '🚫 Apenas administradores!', msg);
            return true;
        }
    }

    await enviarMenuApp(cmd, chat, sock, msg);
    return true;
}

// ============================================================
// AVISOS DO PAINEL PARA O DONO
// ============================================================

let _notifTimer = null;

async function iniciarAvisosDoPainel(sock, intervaloMs = 30000) {
    if (_notifTimer) clearInterval(_notifTimer);
    const checar = async () => {
        try {
            const j = await api('/api/public/bot/notifications');
            if (!j.ok || !j.notificacoes?.length) return;
            const jid = String(j.dono).replace(/\D/g, '') + '@s.whatsapp.net';
            for (const n of j.notificacoes) {
                await sock.sendMessage(jid, { text: n.mensagem });
            }
        } catch (e) {
            console.error('[menus] aviso do painel falhou:', e.message);
        }
    };
    _notifTimer = setInterval(checar, intervaloMs);
    checar();
    preAquecer();
}

// ============================================================
// COMPATIBILIDADE COM O CÓDIGO ANTIGO
// ============================================================

const enviarMenu = (chat, sock, msg) => enviarMenuApp('menu', chat, sock, msg);
const enviarMenus = (chat, sock, msg) => enviarMenuApp('menus', chat, sock, msg);
const enviarMenuAdm = (chat, sock, msg) => enviarMenuApp('menuadm', chat, sock, msg);
const enviarMenuBrincadeira = (chat, sock, msg) => enviarMenuApp('menubrincadeira', chat, sock, msg);
const enviarMenuDono = (chat, sock, msg) => enviarMenuApp('menudono', chat, sock, msg);

// ============================================================
// EXPORTAR
// ============================================================

module.exports = {
    tratarComandoMenu,
    dadosDoBot,
    preAquecer,
    iniciarAvisosDoPainel,
    enviarMenuApp,
    enviarMenu,
    enviarMenus,
    enviarMenuAdm,
    enviarMenuBrincadeira,
    enviarMenuDono,
    cmdSetMidia,
    cmdResetMenu
};