// ==================== IMPORTAÇÕES ====================
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, downloadMediaMessage, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const P = require('pino');
const { Boom } = require('@hapi/boom');
const readline = require('readline');
const fetch = require('node-fetch');
const { cmdPinterest } = require('./services/pinterest.js');
const { processarAntiPalavrao, cmdAntiPalavrao } = require('./services/antiPalavrao.js');
const CONFIG = require('./config.js');
const { cmdPlay, cmdLimparCachePlay, cmdCacheStatusPlay } = require('./services/play.js');
const execAsync = promisify(exec);  
const { startBot, getSocket, isConnected, setOnBotOnline } = require('./bot.js');
const { cmdYt } = require('./services/youtube.js');
const { cmdStickerToMedia } = require('./services/stickerToMedia.js');
const { cmdStickerToGif } = require('./services/stickerToGif.js');
const { renomearFigurinha } = require('./services/renameSticker.js');
const { getProfile, formatarPerfil } = require('./services/profile.js');
const { createSticker } = require('./services/sticker.js');
const { play } = require('./services/spiderX.js');
const { cmdBotInfo } = require('./services/botInfo.js');
const { cmdWaifu, cmdNeko } = require('./services/waifu.js');

// ==================== INÍCIO DO BOT ====================
global.inicioBot = Date.now();
// ==================== PASTAS ====================
const PASTAS = {
  auth: path.join(process.cwd(), 'auth_joe'),
  musicas: path.join(process.cwd(), 'musicas'),
  temp: path.join(process.cwd(), 'temp'),
  cache: path.join(process.cwd(), 'cache'),
  session: path.join(process.cwd(), 'session')
};

// ==================== CACHE ====================
const cacheBusca = new Map();
const CACHE_TEMPO = 120000; // 2 minutos
const downloadsAtivos = new Map();

// Criar pastas necessárias
Object.values(PASTAS).forEach(pasta => {
  if (!fs.existsSync(pasta)) fs.mkdirSync(pasta, { recursive: true });
});

// ==================== BANCO DE DADOS ====================
let db = {
  welcome: {},
  welcomeMsg: {},
  antilink: {},
  antilinkBan: {},
  mutados: {},
  rankAtivo: {},
  nivelAtivo: {},
  afk: {},
  donos: [],
  regras: {},
  interactionGifs: {
    tapa: "", matar: "", beijar: "", abracar: "", socar: ""
  },
  warning: {},
  antiSpam: {},
  temporizador: {},
  nivelXp: {},
  antiPalavrao: {},
  levelConfig: {},
  agendamentos: {}
};

const { 
    cmdShip, 
    cmdShipTop, 
    cmdPedir,
    cmdAceitar,
    cmdRecusar,
    cmdPedidos,
    cmdCasados, 
    cmdDivorciar, 
    cmdAmor,
    cmdPresentear
} = require('./services/marriage.js');

// ==================== IMPORTAÇÕES ====================
const { 
    cmdSetGroupPhoto,
    cmdSetGroupDesc,
    cmdGroupInfo,
    cmdGroupDesc,
    cmdGroupAdmins,
    cmdGroupMembers,
    cmdGroupId,
    cmdGroupCreated
} = require('./services/group.js');

// ==================== IMPORTAÇÕES ====================
const {
    cmdAntiAudio,
    cmdAntiImage,
    cmdAntiVideo,
    cmdAntiSticker,
    cmdAntiDocument,
    processarAntiMidia
} = require('./services/antiMidia.js');

// ==================== IMPORTAÇÕES ====================
const {
    cmdRankFeio,
    cmdRankBonito,
    cmdRankCorno,
    cmdRankGay,
    cmdRankFofo,
    cmdRankDoido,
    cmdSetRankImage,
    cmdBaixarRankImages,
    initRankings,
    baixarTodasImagensRankings
} = require('./services/rankings.js');

// ==================== IMPORTAÇÕES ====================
const {
    cmdBlacklistAdd,
    cmdBlacklistRemove,
    cmdBlacklistView,
    initBlacklist
} = require('./services/blacklist.js');

// ==================== IMPORTAÇÕES ====================
const { 
    tratarComandoMenu,
    iniciarAvisosDoPainel,
    enviarMenu,
    enviarMenus,
    enviarMenuAdm,
    enviarMenuBrincadeira,
    enviarMenuDono
} = require('./services/menus.js');

// ==================== IMPORTAÇÕES ====================
const { 
    enviarBoasVindas,
    enviarSaida,
    cmdWelcome,
    cmdSetWelcome,
    cmdResetWelcome,
    cmdWelcomeSaida,
    cmdSetWelcomeSaida,
    cmdResetWelcomeSaida
} = require('./services/welcome.js');

const DB_PATH = path.join(process.cwd(), 'database.json');
if (fs.existsSync(DB_PATH)) {
  try { 
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    db = { ...db, ...data };
  } catch(e) { console.error('Erro ao carregar DB'); }
}

function salvarDB() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch(e) { 
    console.error('Erro ao salvar DB:', e.message); 
  }
}

// ==================== INICIALIZAR ESTRUTURAS DO DB ====================
const initDB = () => {
  // Estruturas existentes
  ['mutados', 'rankAtivo', 'nivelAtivo', 'afk', 'donos', 'regras', 'warning', 'antiSpam', 'temporizador', 'nivelXp', 'levelConfig', 'agendamentos'].forEach(key => {
    if (!db[key]) db[key] = {};
  });
  
  if (!db.interactionGifs) {
    db.interactionGifs = { tapa: "", matar: "", beijar: "", abracar: "", socar: "" };
  }
  if (!db.welcome) db.welcome = {};
  if (!db.welcomeMsg) db.welcomeMsg = {};
  if (!db.antilink) db.antilink = {};
  if (!db.antilinkBan) db.antilinkBan = {};
  
  // 🔥 ADICIONAR CONFIGURAÇÃO DO MENU
  if (!db.menuConfig) {
    db.menuConfig = {
      global: {
        prefix: '°',
        video: null,
        image: null,
        audio: null,
        audioDono: null,
        updatedBy: null,
        updatedAt: null
      }
    };
  }
};
initDB();

// ==================== IMPORTAÇÕES DO RPG ====================
const {
    initModule,
    trabalhar,
    diaria,
    vagasEmprego,
    contratar,
    demitir,
    carteira,
    rankTrabalho,
    cmdJogoDaVelha,
    cmdJogarVelha,
    cmdCassino,
    cmdDepositar,
    cmdSacar,
    cmdTransferir,
    cmdMinerar,
    cmdComprarPicareta,
    cmdComprarEscudo,
    cmdQuiz,
    cmdColherPolen,
    cmdRankGold
} = require('./services/rpgSystem.js');
// 🔥 INICIALIZAR O MÓDULO RPG
initModule(db, CONFIG, enviarResposta, DB_PATH);

// ==================== IMPORTAÇÃO DO SISTEMA DE ÁUDIO ====================
const {
    processarAudio,
    cmdVideoToAudio,
    cmdListarEfeitos,
    EFEITOS
} = require('./services/audioEffects.js');

// ==================== FUNÇÕES AUXILIARES ====================
function obterNomeUsuario(sock, jid) {
  try {
    const nome = sock.user?.name || sock.user?.pushName || jid.split('@')[0];
    return nome;
  } catch { return jid.split('@')[0]; }
}

async function marcarComoLida(sock, msg) {
  try { await sock.readMessages([msg.key]); } catch (e) {}
}

async function verificarAdmin(sock, chat, sender) {
  try {
    const metadata = await sock.groupMetadata(chat);
    return metadata.participants.some(p => p.id === sender && p.admin);
  } catch { return false; }
}

async function isDono(sender) {
  const senderId = sender.split('@')[0];
  return senderId === CONFIG.donoOriginal || (Array.isArray(db.donos) && db.donos.includes(senderId));
}

async function podeComandoAdmin(sock, chat, sender) {
  const isAdmin = await verificarAdmin(sock, chat, sender);
  const isDonoBot = await isDono(sender);
  return isAdmin || isDonoBot;
}

async function podeBanir(sock, chat, sender, alvo) {
  const pode = await podeComandoAdmin(sock, chat, sender);
  if (!pode) return { pode: false, motivo: '🚫 Apenas administradores!' };
  
  const alvoAdmin = await verificarAdmin(sock, chat, alvo);
  if (alvoAdmin) {
    return { pode: false, motivo: '🛡️ Não é possível banir um administrador!' };
  }
  
  if (await isDono(alvo)) {
    await alertarContraDono(chat, sock, null);
    return { pode: false, motivo: '🔒 Não pode banir o dono!' };
  }
  
  if (alvo === sock.user.id) {
    return { pode: false, motivo: '❌ Não posso me banir!' };
  }
  
  return { pode: true };
}

const avisosContraDono = [
  '🚫 Ops! Esse é o criador do bot!',
  '⚠️ Tentativa frustrada!',
  '🔒 Você não pode fazer isso!',
  '💀 O dono é imune!',
  '🤖 Proteção ativada!',
  '🎵 Nem tente!',
  '🛡️ Escudo ativado!',
  '⚡ Comando bloqueado!'
];

async function alertarContraDono(chat, sock, msg) {
  const aviso = avisosContraDono[Math.floor(Math.random() * avisosContraDono.length)];
  if (msg) {
    await enviarResposta(chat, sock, aviso, msg);
  } else {
    await sock.sendMessage(chat, { text: aviso });
  }
}

async function obterMencionado(msg, texto) {
  let mencionado = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  if (!mencionado) {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
    if (quoted) return quoted;
    const match = texto.match(/@(\d+)/);
    if (match) return `${match[1]}@s.whatsapp.net`;
  }
  return mencionado;
}

async function reagir(sock, chat, msgId, emoji) {
  try { await sock.sendMessage(chat, { react: { text: emoji, key: { remoteJid: chat, id: msgId } } }); } catch (e) {}
}

const emojiProcessando = '⏲️';
const emojiSucesso = '❇️';
const emojiErro = '❗';
const emojiAudio = '🎶';
const emojiSticker = '🎨';

// ==================== ENVIO DE RESPOSTAS ====================
async function enviarResposta(chat, sock, texto, quoted, mentions = []) {
  const footer = `\n\n🎮 ${CONFIG.botNome} | 👑 ${CONFIG.donoOriginal}`;
  const msgFinal = texto + footer;
  try {
    await sock.sendMessage(chat, { text: msgFinal, mentions }, { quoted });
  } catch (e) {
    await sock.sendMessage(chat, { text: msgFinal, mentions }, { quoted });
  }
}

// ==================== SISTEMA DE AGENDAMENTO ====================

let schedulerInterval = null;
let sockGlobal = null;

function salvarAgendamentos() {
  if (!db.agendamentos) db.agendamentos = {};
  salvarDB();
}

function carregarAgendamentos() {
  if (!db.agendamentos) db.agendamentos = {};
  return db.agendamentos;
}

async function agendarFechamento(chat, sock, hora, minuto, msg) {
  const horario = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
  
  if (!db.agendamentos) db.agendamentos = {};
  if (!db.agendamentos[chat]) {
    db.agendamentos[chat] = {};
  }
  
  db.agendamentos[chat].fechar = {
    hora: hora,
    minuto: minuto,
    horario: horario,
    ativo: true,
    criadoEm: new Date().toISOString(),
    criadoPor: msg.key.participant || msg.key.remoteJid
  };
  
  salvarAgendamentos();
  
  await enviarResposta(chat, sock, `✅ Grupo programado para FECHAR às *${horario}* todos os dias!`, msg);
  await reagir(sock, chat, msg.key.id, '🔒');
  
  iniciarScheduler(sock);
}

async function agendarAbertura(chat, sock, hora, minuto, msg) {
  const horario = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
  
  if (!db.agendamentos) db.agendamentos = {};
  if (!db.agendamentos[chat]) {
    db.agendamentos[chat] = {};
  }
  
  db.agendamentos[chat].abrir = {
    hora: hora,
    minuto: minuto,
    horario: horario,
    ativo: true,
    criadoEm: new Date().toISOString(),
    criadoPor: msg.key.participant || msg.key.remoteJid
  };
  
  salvarAgendamentos();
  
  await enviarResposta(chat, sock, `✅ Grupo programado para ABRIR às *${horario}* todos os dias!`, msg);
  await reagir(sock, chat, msg.key.id, '🔓');
  
  iniciarScheduler(sock);
}

// ==================== GERAR IMAGEM COM IA (SUNNY) ====================

async function cmdGerarImagem(chat, sock, msg, args, sender) {
    if (!CONFIG.comandos.img) {
        await enviarResposta(chat, sock, `⛔ O comando °img está desativado!`, msg);
        return;
    }

    const prompt = args.join(' ').trim();
    
    if (!prompt) {
        await enviarResposta(chat, sock, `🖼️ Digite o que você quer gerar!\n📌 Exemplo: ${CONFIG.prefix}img um gatinho astronauta fofo`, msg);
        return;
    }

    await reagir(sock, chat, msg.key.id, '🎨');

    try {
        const API_URL = `${CONFIG.apis.sunny}/api/public/generate-image`;
        
        console.log(`🎨 Gerando imagem: "${prompt}"`);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt,
                format: CONFIG.sunny.format
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro da API:', errorText);
            throw new Error(`API erro: ${response.status} - ${errorText}`);
        }

        const buffer = Buffer.from(await response.arrayBuffer());

        const legenda = `╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ 🖼️ IMAGEM GERADA POR JUFUFU IA
┃ 📝 ${prompt}
┃ ☀️ JUFUFU✨
╰━━━━━━━━━━━━━━━━━━━━━⬢
『 ${CONFIG.botNome} 』`;

        await sock.sendMessage(chat, {
            image: buffer,
            caption: legenda
        }, { quoted: msg });

        await reagir(sock, chat, msg.key.id, '✅');
        console.log(`✅ Imagem gerada: "${prompt}"`);

    } catch (error) {
        console.error('❌ Erro ao gerar imagem:', error.message);
        await enviarResposta(chat, sock, `❌ Erro ao gerar imagem: ${error.message}`, msg);
        await reagir(sock, chat, msg.key.id, '❌');
    }
}


// ==================== VER AGENDAMENTOS ====================
async function verAgendamentos(chat, sock, msg) {
  const agendamentos = db.agendamentos?.[chat];
  
  if (!agendamentos || (!agendamentos.fechar && !agendamentos.abrir)) {
    await enviarResposta(chat, sock, '📭 Nenhum agendamento configurado para este grupo!', msg);
    return;
  }
  
  let texto = `〘 𝙹𝚄𝙵𝚄𝙵𝚄-ᶻᶻᶻ_b̶o҈꓄ 〙\n╭━━━━━━━━━━━━━━━━━━━━━⬢\n┃        📅 AGENDAMENTOS\n╰━━━━━━━━━━━━━━━━━━━━━⬢\n`;
  
  if (agendamentos.fechar && agendamentos.fechar.ativo) {
    const criadoPor = agendamentos.fechar.criadoPor?.split('@')[0] || 'Desconhecido';
    texto += `╭━━━━━━━━━━━━━⬢\n┃ 🔒 FECHAR: ${agendamentos.fechar.horario}\n┃ 👤 Criado por: @${criadoPor}\n┃ 📅 Data: ${new Date(agendamentos.fechar.criadoEm).toLocaleDateString('pt-BR')}\n╰━━━━━━━━━━━━━⬢\n`;
  }
  
  if (agendamentos.abrir && agendamentos.abrir.ativo) {
    const criadoPor = agendamentos.abrir.criadoPor?.split('@')[0] || 'Desconhecido';
    texto += `╭━━━━━━━━━━━━━⬢\n┃ 🔓 ABRIR: ${agendamentos.abrir.horario}\n┃ 👤 Criado por: @${criadoPor}\n┃ 📅 Data: ${new Date(agendamentos.abrir.criadoEm).toLocaleDateString('pt-BR')}\n╰━━━━━━━━━━━━━⬢\n`;
  }
  
  texto += `╭━━━━━━━━━━━━━━━━━━━━━⬢\n┃ 📌 ${CONFIG.prefix}deletaragenda <fechar/abrir/tudo>\n╰━━━━━━━━━━━━━━━━━━━━━⬢\n『 𝙹𝚄𝙵𝚄𝙵𝚄-ᶻᶻᶻ_b̶o҈꓄ 』`;
  
  const mentions = [];
  if (agendamentos.fechar?.criadoPor) mentions.push(agendamentos.fechar.criadoPor);
  if (agendamentos.abrir?.criadoPor) mentions.push(agendamentos.abrir.criadoPor);
  
  await sock.sendMessage(chat, { text: texto, mentions }, { quoted: msg });
}

// ==================== DELETAR AGENDAMENTO ====================
async function deletarAgendamento(chat, sock, args, msg) {
  const tipo = args[0]?.toLowerCase();
  
  if (!tipo) {
    await enviarResposta(chat, sock, `📌 Use: ${CONFIG.prefix}deletaragenda <fechar/abrir/tudo>`, msg);
    return;
  }
  
  if (!db.agendamentos?.[chat]) {
    await enviarResposta(chat, sock, '📭 Nenhum agendamento encontrado!', msg);
    return;
  }
  
  if (tipo === 'fechar' || tipo === 'f') {
    delete db.agendamentos[chat].fechar;
    await enviarResposta(chat, sock, '✅ Agendamento de FECHAR removido!', msg);
  } else if (tipo === 'abrir' || tipo === 'a') {
    delete db.agendamentos[chat].abrir;
    await enviarResposta(chat, sock, '✅ Agendamento de ABRIR removido!', msg);
  } else if (tipo === 'tudo' || tipo === 'all') {
    delete db.agendamentos[chat];
    await enviarResposta(chat, sock, '✅ Todos os agendamentos removidos!', msg);
  } else {
    await enviarResposta(chat, sock, `❌ Tipo inválido! Use: fechar, abrir ou tudo`, msg);
    return;
  }
  
  salvarAgendamentos();
  await reagir(sock, chat, msg.key.id, '🗑️');
}

// ==================== EXECUTAR AGENDAMENTOS ====================
async function executarAgendamentos(sock) {
  if (!sock) {
    console.log('⚠️ Sock não disponível para executar agendamentos');
    return;
  }
  
  const agora = new Date();
  const hora = agora.getHours();
  const minuto = agora.getMinutes();
  const horarioAtual = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
  
  const totalAgendamentos = Object.keys(db.agendamentos || {}).length;
  if (totalAgendamentos === 0) return;
  
  for (const [chat, agendamentos] of Object.entries(db.agendamentos || {})) {
    try {
      if (!chat.endsWith('@g.us')) continue;
      
      if (agendamentos.fechar?.ativo) {
        const { hora: h, minuto: m } = agendamentos.fechar;
        if (h === hora && m === minuto) {
          await sock.groupSettingUpdate(chat, 'announcement');
          await sock.sendMessage(chat, { 
            text: `🔒 *GRUPO FECHADO* automaticamente às ${horarioAtual}\n📌 Apenas administradores podem enviar mensagens.` 
          });
        }
      }
      
      if (agendamentos.abrir?.ativo) {
        const { hora: h, minuto: m } = agendamentos.abrir;
        if (h === hora && m === minuto) {
          await sock.groupSettingUpdate(chat, 'not_announcement');
          await sock.sendMessage(chat, { 
            text: `🔓 *GRUPO ABERTO* automaticamente às ${horarioAtual}\n📌 Todos podem enviar mensagens agora.` 
          });
        }
      }
      
    } catch (err) {
      console.error(`❌ Erro ao executar agendamento para ${chat}:`, err.message);
    }
  }
}

// ==================== INICIAR SCHEDULER ====================
function iniciarScheduler(sock) {
  if (sock) {
    sockGlobal = sock;
  }
  
  const sockToUse = sock || sockGlobal;
  
  if (!sockToUse) {
    console.log('⚠️ Aguardando sock para iniciar scheduler...');
    return;
  }
  
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
  
  schedulerInterval = setInterval(async () => {
    try {
      const currentSock = sock || sockGlobal;
      if (currentSock) {
        await executarAgendamentos(currentSock);
      }
    } catch (err) {
      console.error('❌ Erro no scheduler:', err.message);
    }
  }, 30000);
}

// ==================== CARREGAR AGENDAMENTOS AO INICIAR ====================
function carregarAgendamentosInicial(sock) {
  const agendamentos = carregarAgendamentos();
  const total = Object.keys(agendamentos).length;
  console.log(`📅 ${total} grupos com agendamentos carregados`);
  
  if (total > 0) {
    for (const [chat, agenda] of Object.entries(agendamentos)) {
      let msg = `📅 ${chat.split('@')[0]}:`;
      if (agenda.fechar) msg += ` 🔒 ${agenda.fechar.horario}`;
      if (agenda.abrir) msg += ` 🔓 ${agenda.abrir.horario}`;
      console.log(msg);
    }
  }
  
  if (sock) {
    iniciarScheduler(sock);
  } else {
    console.log('⚠️ Sock não disponível para iniciar scheduler');
  }
}

// ==================== ANTI-LINK DUPLO ====================
async function antiLink(sock, chat, sender, texto, msg) {
  if (!texto || typeof texto !== 'string') return false;
  
  const isAdmin = await verificarAdmin(sock, chat, sender);
  const dono = await isDono(sender);
  
  if (isAdmin || dono || sender === sock.user.id) return false;
  
  const linkRegex = /(?:https?:\/\/|www\.)\S+|(?:[a-zA-Z0-9-]+\.)+(com|net|org|gg|io|dev|xyz|app|me|tv|br)\b/gi;
  
  if (!linkRegex.test(texto)) return false;
  
  try {
    if (db.antilink[chat]) {
      await sock.sendMessage(chat, { delete: msg.key });
      await sock.groupParticipantsUpdate(chat, [sender], 'remove');
      await enviarResposta(chat, sock, `🚫 @${sender.split('@')[0]} removido por link!`, null, [sender]);
      return true;
    }
    
    if (db.antilinkBan[chat]) {
      await sock.groupParticipantsUpdate(chat, [sender], 'remove');
      await enviarResposta(chat, sock, `🚫 @${sender.split('@')[0]} removido por link!\n📌 Mensagem mantida como prova.`, null, [sender]);
      return true;
    }
    
    return false;
  } catch (err) {
    console.log(err);
    return false;
  }
}
 
// ==================== COMANDO °AUDIO ====================
async function cmdAudio(chat, sock, msg, args, sender) {
    const efeito = args[0]?.toLowerCase();
    if (!efeito) {
        await cmdListarEfeitos(chat, sock, msg);
        return;
    }
    await processarAudio(chat, sock, msg, efeito, sender, enviarResposta, reagir, downloadMediaMessage, P, CONFIG);
}

// ==================== COMANDO °VIDEOAUDIO ====================
async function cmdVideoAudio(chat, sock, msg, sender) {
    await cmdVideoToAudio(chat, sock, msg, sender, enviarResposta, reagir, downloadMediaMessage, P, CONFIG);
}

// ==================== COMANDO °EFEITOS ====================
async function cmdEfeitos(chat, sock, msg) {
    await cmdListarEfeitos(chat, sock, msg, enviarResposta, CONFIG);
}

// ==================== COMANDOS DE PORCENTAGENS COM VÍDEOS ====================

const VIDEOS_PORCENTAGEM = {
  'gay': [
    'https://wivkiglslhvvmutsexlx.supabase.co/storage/v1/object/public/uploads/1783779888647-mixclr.mp4',
    'https://wivkiglslhvvmutsexlx.supabase.co/storage/v1/object/public/uploads/1783779888647-mixclr.mp4',
    'https://wivkiglslhvvmutsexlx.supabase.co/storage/v1/object/public/uploads/1783779888647-mixclr.mp4'
  ],
  'corno': [
    'https://wivkiglslhvvmutsexlx.supabase.co/storage/v1/object/public/uploads/1783812361096-2ldfc6.mp4',
    'https://wivkiglslhvvmutsexlx.supabase.co/storage/v1/object/public/uploads/1783812361096-2ldfc6.mp4'
  ],
  'passivo': [
    'https://wivkiglslhvvmutsexlx.supabase.co/storage/v1/object/public/uploads/video_passivo1.mp4',
    'https://wivkiglslhvvmutsexlx.supabase.co/storage/v1/object/public/uploads/video_passivo2.mp4'
  ],
  'lindo': [
    'https://wivkiglslhvvmutsexlx.supabase.co/storage/v1/object/public/uploads/1783812385043-6efelc.mp4'
  ],
  'linda': [
    'https://wivkiglslhvvmutsexlx.supabase.co/storage/v1/object/public/uploads/1783812451661-vf7cxx.mp4'
  ],
  'feio': [
    'https://wivkiglslhvvmutsexlx.supabase.co/storage/v1/object/public/uploads/video_feio1.mp4'
  ],
  'feia': [
    'https://wivkiglslhvvmutsexlx.supabase.co/storage/v1/object/public/uploads/video_feia1.mp4'
  ],
  'lesbica': [
    'https://wivkiglslhvvmutsexlx.supabase.co/storage/v1/object/public/uploads/1783812468138-ldu95r.mp4'
  ],
  'inteligente': [
    'https://wivkiglslhvvmutsexlx.supabase.co/storage/v1/object/public/uploads/video_inteligente1.mp4'
  ],
  'burro': [
    'https://wivkiglslhvvmutsexlx.supabase.co/storage/v1/object/public/uploads/1783812508143-tpvyb4.mp4'
  ],
  'burra': [
    'https://wivkiglslhvvmutsexlx.supabase.co/storage/v1/object/public/uploads/1783812508143-tpvyb4.mp4'
  ]
};

const FOTOS_PADRAO = [
  "https://wivkiglslhvvmutsexlx.supabase.co/storage/v1/object/public/uploads/1783600763527-x2fy02.jpg",
  "https://wivkiglslhvvmutsexlx.supabase.co/storage/v1/object/public/uploads/1783600799374-qcm0be.jpg",
  "https://wivkiglslhvvmutsexlx.supabase.co/storage/v1/object/public/uploads/1783600816412-ybqzns.jpg",
  "https://wivkiglslhvvmutsexlx.supabase.co/storage/v1/object/public/uploads/1783600838200-q7fdzb.jpg",
  "https://wivkiglslhvvmutsexlx.supabase.co/storage/v1/object/public/uploads/1783600851281-m3yhaw.jpg"
];

function getFotoAleatoria() {
  return FOTOS_PADRAO[Math.floor(Math.random() * FOTOS_PADRAO.length)];
}

function getVideoAleatorio(tipo) {
  const videos = VIDEOS_PORCENTAGEM[tipo] || [];
  if (videos.length === 0) return null;
  return videos[Math.floor(Math.random() * videos.length)];
}

function gerarBarra(valor, total = 100, tamanho = 15) {
  const percentual = Math.min(Math.floor((valor / total) * tamanho), tamanho);
  let barra = '';
  for (let i = 0; i < tamanho; i++) {
    if (i < percentual) {
      barra += '▰';
    } else {
      barra += '▱';
    }
  }
  return barra;
}

// ==================== FUNÇÃO PRINCIPAL DE PORCENTAGEM (COM GIF) ====================
async function cmdPorcentagem(sock, chat, sender, msg, args, tipo) {
  const target = args.length > 0 && args[0].startsWith('@') 
    ? args[0].replace('@', '') + '@s.whatsapp.net' 
    : sender;
  
  const nome = target.split('@')[0];
  
  let foto = null;
  try {
    foto = await sock.profilePictureUrl(target, 'image');
  } catch (err) {
    foto = getFotoAleatoria();
  }
  
  const valor = Math.floor(Math.random() * 101);
  const barra = gerarBarra(valor);
  
  let videoUrl = getVideoAleatorio(tipo);
  
  const configs = {
    'gay': { 
      emoji: '🏳️‍🌈', 
      titulo: 'Gay', 
      alto: '🌈 ORGULHO LGBTQIA+', 
      medio: '💖 Arco-Íris Fraco', 
      baixo: '💔 Hetero Top',
      comentarios: [
        '🏳️‍🌈 Arrasou migo!',
        '🌈 Orgulho do grupo!',
        '💖 Tá quase lá!',
        '💔 Ainda não descobriu...',
        '🏳️‍🌈 Rei/ Rainha do Orgulho!'
      ]
    },
    'corno': { 
      emoji: '🦌', 
      titulo: 'Corno', 
      alto: '🦌🚨 REI DO CHIFRE', 
      medio: '🤔 Corno Moderado', 
      baixo: '😎 Seguro Demais',
      comentarios: [
        '🦌 Cuidado com a galhada!',
        '🚨 Alerta de chifre!',
        '🤔 Já desconfio...',
        '😎 De boas, sem chifre',
        '🦌 O Corno Mestre!'
      ]
    },
    'passivo': { 
      emoji: '😒', 
      titulo: 'Passivo', 
      alto: '👑 REI DO VÁCUO', 
      medio: '📈 Passivo Moderado', 
      baixo: '😇 Ativo Demais',
      comentarios: [
        '🙄 Tá ocupado ou só ignorando?',
        '😏 "Vou responder depois" - famoso',
        '👀 Vi sua mensagem hein...',
        '😴 Acorda pra vida!',
        '👻 É vivo ou é fantasma?'
      ]
    },
    'lindo': { 
      emoji: '✨', 
      titulo: 'Lindo', 
      alto: '👑 PERFEIÇÃO', 
      medio: '😊 Bonito', 
      baixo: '😐 Normal',
      comentarios: [
        '✨ Maravilhoso(a)!',
        '👑 Beleza rara!',
        '😊 Muito bonito(a)!',
        '😐 Podia ser pior...',
        '⭐ Deusa/Deus da beleza!'
      ]
    },
    'linda': { 
      emoji: '✨', 
      titulo: 'Linda', 
      alto: '👑 PERFEIÇÃO', 
      medio: '😊 Bonita', 
      baixo: '😐 Normal',
      comentarios: [
        '✨ Maravilhosa!',
        '👑 Beleza rara!',
        '😊 Muito bonita!',
        '😐 Podia ser pior...',
        '⭐ Deusa da beleza!'
      ]
    },
    'feio': { 
      emoji: '👹', 
      titulo: 'Feio', 
      alto: '💀 MORFEIO', 
      medio: '😅 Feinho', 
      baixo: '😇 Bonito por dentro',
      comentarios: [
        '👹 Mas tem coração!',
        '💀 Tadinho(a)...',
        '😅 Feinho mas é gente boa',
        '😇 Beleza interior conta',
        '👹 O Feio Mestre!'
      ]
    },
    'feia': { 
      emoji: '👹', 
      titulo: 'Feia', 
      alto: '💀 MORFEIA', 
      medio: '😅 Feinha', 
      baixo: '😇 Bonita por dentro',
      comentarios: [
        '👹 Mas tem coração!',
        '💀 Tadinha...',
        '😅 Feinha mas é gente boa',
        '😇 Beleza interior conta',
        '👹 A Feia Mestra!'
      ]
    },
    'lesbica': { 
      emoji: '👩‍❤️‍👩', 
      titulo: 'Lésbica', 
      alto: '🌈 ORGULHO LÉSBICO', 
      medio: '💖 Sapatão Fraco', 
      baixo: '💔 Hetero Top',
      comentarios: [
        '👩‍❤️‍👩 Orgulho lésbico!',
        '🌈 Arrasou miga!',
        '💖 Tá quase lá!',
        '💔 Ainda não descobriu...',
        '👩‍❤️‍👩 Rainha do Orgulho!'
      ]
    },
    'inteligente': { 
      emoji: '🧠', 
      titulo: 'Inteligente', 
      alto: '🧠📚 GÊNIO', 
      medio: '🤓 Esperto', 
      baixo: '😶 Burrinho',
      comentarios: [
        '🧠 Cérebro de Einstein!',
        '📚 Muito inteligente!',
        '🤓 Sabichão!',
        '😶 Tá aprendendo ainda...',
        '🧠 O Gênio do Grupo!'
      ]
    },
    'burro': { 
      emoji: '🐴', 
      titulo: 'Burro', 
      alto: '🐴💀 MUITO BURRO', 
      medio: '😅 Burrinho', 
      baixo: '🧠 Esperto',
      comentarios: [
        '🐴 Tadinho...',
        '💀 Burrice nível máximo!',
        '😅 Burrinho mas é gente boa',
        '🧠 Na verdade é esperto',
        '🐴 O Burro Mestre!'
      ]
    },
    'burra': { 
      emoji: '🐴', 
      titulo: 'Burra', 
      alto: '🐴💀 MUITO BURRA', 
      medio: '😅 Burrinha', 
      baixo: '🧠 Esperta',
      comentarios: [
        '🐴 Tadinha...',
        '💀 Burrice nível máximo!',
        '😅 Burrinha mas é gente boa',
        '🧠 Na verdade é esperta',
        '🐴 A Burra Mestra!'
      ]
    }
  };
  
  const config = configs[tipo];
  if (!config) return;
  
  let statusTexto = '';
  if (valor >= 80) statusTexto = config.alto;
  else if (valor >= 50) statusTexto = config.medio;
  else statusTexto = config.baixo;
  
  const comentarioAleatorio = config.comentarios[Math.floor(Math.random() * config.comentarios.length)];
  
  const texto = `〘 ${CONFIG.botNome} 〙
╭━━━━━━━━━━━━━━━━━━━━━⬢
┃〔 ◈ USUARIO: 『 @${nome} 』
┃〔 ◈ ${config.emoji} ${config.titulo}: 『 ${valor}% 』
┃〔 ◈ STATUS: 『 ${statusTexto} 』
┃〔 ◈ COMENTÁRIO: 『 ${comentarioAleatorio} 』
╰━━━━━━━━━━━━━━━━━━━━━⬢

┃ ${barra}

╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ ${config.emoji} ${valor}% de ${config.titulo}
╰━━━━━━━━━━━━━━━━━━━━━⬢
『 ${CONFIG.botNome}  』
▰▰▰▰▰▰▰▰▰▰ 100%
╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ 𝙲𝚛𝚒𝚊𝚍𝚘𝚛: ${CONFIG.donoOriginal}
┃ 𝙱𝚘𝚝: ${CONFIG.botNome}
╰━━━━━━━━━━━━━━━━━━━━━⬢`;

  const mentions = [target];
  
  try {
    if (videoUrl && videoUrl.startsWith('http')) {
      await sock.sendMessage(chat, { 
        video: { url: videoUrl },
        gifPlayback: true,
        caption: texto,
        mentions 
      }, { quoted: msg });
    } else if (foto) {
      await sock.sendMessage(chat, { 
        image: { url: foto }, 
        caption: texto, 
        mentions 
      }, { quoted: msg });
    } else {
      await sock.sendMessage(chat, { 
        text: texto, 
        mentions 
      }, { quoted: msg });
    }
  } catch (err) {
    console.error('❌ Erro ao enviar mídia:', err.message);
    try {
      await sock.sendMessage(chat, { 
        text: texto, 
        mentions 
      }, { quoted: msg });
    } catch (e) {
      console.error('❌ Fallback também falhou:', e.message);
    }
  }
}

// ==================== RANK ATIVO ====================
async function contarMensagem(chat, sender, msg, sock) {
  if (!chat.endsWith('@g.us')) return;
  if (sender === sock.user.id) return;
  if (msg.key.fromMe) return;
  
  if (!db.rankAtivo[chat]) db.rankAtivo[chat] = {};
  if (!db.rankAtivo[chat][sender]) {
    db.rankAtivo[chat][sender] = { mensagens: 0, ultimaMsg: Date.now(), tipos: {} };
  }
  db.rankAtivo[chat][sender].mensagens++;
  db.rankAtivo[chat][sender].ultimaMsg = Date.now();
  salvarDB();
}

// ==================== RANK ATIVO - VISUAL PREMIUM ====================
async function mostrarRankAtivo(chat, sock, msg) {
  const rankData = db.rankAtivo[chat];
  if (!rankData || Object.keys(rankData).length === 0) {
    await enviarResposta(chat, sock, '📊 Nenhuma mensagem registrada!', msg);
    return;
  }
  
  const ranking = Object.entries(rankData)
    .map(([id, data]) => ({ id, mensagens: data.mensagens }))
    .sort((a, b) => b.mensagens - a.mensagens)
    .slice(0, 15);
  
  const totalMensagens = ranking.reduce((acc, user) => acc + user.mensagens, 0);
  const agora = new Date();
  const dataAtual = agora.toLocaleDateString('pt-BR');
  const horaAtual = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  let texto = `╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ 🏆 𝐑𝐀𝐍𝐊 𝐃𝐎 𝐆𝐑𝐔𝐏𝐎
┃ 📊 ${ranking.length} usuários ativos
┃ 💬 ${totalMensagens} mensagens totais
┃ 📅 ${dataAtual} | 🕐 ${horaAtual}
╰━━━━━━━━━━━━━━━━━━━━━⬢

╭━━━━━━━━━━━━━━━━━━━━━⬢\n`;
  
  ranking.forEach((user, index) => {
    let medalha = '';
    let cor = '';
    if (index === 0) {
      medalha = '👑';
      cor = '🥇';
    } else if (index === 1) {
      medalha = '🥈';
    } else if (index === 2) {
      medalha = '🥉';
    } else if (index < 6) {
      medalha = '⭐';
    } else if (index < 11) {
      medalha = '💫';
    } else {
      medalha = '🔹';
    }
    
    let status = '';
    if (index === 0) status = '🔥 Líder';
    else if (index === 1) status = '⚡ Vice';
    else if (index === 2) status = '💪 Top 3';
    else if (index < 6) status = '🌟 Destaque';
    else if (index < 11) status = '📈 Ativo';
    else status = '💬 Participante';
    
    const barraTamanho = 15;
    const progresso = Math.min(Math.floor((user.mensagens / totalMensagens) * barraTamanho), barraTamanho);
    let barra = '';
    for (let i = 0; i < barraTamanho; i++) {
      if (i < progresso) {
        barra += '▰';
      } else {
        barra += '▱';
      }
    }
    
    const nome = user.id.split('@')[0];
    texto += `┃ ${medalha} ${cor} @${nome}
┃ 📩 ${user.mensagens} mensagens
┃ ${barra} ${status}
┃ ──────────────────────────\n`;
  });
  
  texto += `╰━━━━━━━━━━━━━━━━━━━━━⬢
╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ 🎮 ${CONFIG.botNome}
┃ 👑 ${CONFIG.donoOriginal}
┃ 📌 Use ${CONFIG.prefix}meustatus para ver sua posição
╰━━━━━━━━━━━━━━━━━━━━━⬢

『 ${CONFIG.botNome} 』
▰▰▰▰▰▰▰▰▰▰ 100%`;
  
  const mentions = ranking.map(user => user.id);
  await sock.sendMessage(chat, { text: texto, mentions }, { quoted: msg });
}

async function resetarRankAtivo(chat, sender, sock, msg) {
  const pode = await podeComandoAdmin(sock, chat, sender);
  if (!pode) {
    await enviarResposta(chat, sock, '🚫 Apenas administradores!', msg);
    return;
  }
  if (!db.rankAtivo[chat]) {
    await enviarResposta(chat, sock, '📊 Nenhum dado encontrado!', msg);
    return;
  }
  db.rankAtivo[chat] = {};
  salvarDB();
  await enviarResposta(chat, sock, '✅ Rank resetado!', msg);
}

async function meuStatus(chat, sock, sender, msg) {
  const rankData = db.rankAtivo[chat];
  if (!rankData || !rankData[sender]) {
    await enviarResposta(chat, sock, '📊 Sem mensagens registradas!', msg);
    return;
  }
  
  const stats = rankData[sender];
  const ranking = Object.entries(rankData).sort((a, b) => b[1].mensagens - a[1].mensagens).map(([id]) => id);
  const posicao = ranking.indexOf(sender) + 1;
  
  const texto = `开启 ${CONFIG.botNome} - Status 〛\n╭━━━━━━━━━━━━━⬢\n┃ 👤 @${sender.split('@')[0]}\n┃ 📊 ${posicao}º lugar\n┃ 💬 ${stats.mensagens} mensagens\n╰━━━━━━━━━━━━━⬢`;
  
  await sock.sendMessage(chat, { text: texto, mentions: [sender] }, { quoted: msg });
}

// ==================== COMANDO °MARCATODOS ====================
async function cmdMarcaTodos(chat, sock, sender, msg) {
    const isAdmin = await verificarAdmin(sock, chat, sender);
    const isDonoBot = await isDono(sender);
    
    if (!isAdmin && !isDonoBot) {
        await enviarResposta(chat, sock, '🚫 Apenas administradores podem usar este comando!', msg);
        return;
    }

    await reagir(sock, chat, msg.key.id, '📢');

    try {
        const metadata = await sock.groupMetadata(chat);
        const participantes = metadata.participants;
        
        const admins = participantes.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
        const membros = participantes.filter(p => !p.admin);
        
        const totalMembros = participantes.length;
        const totalAdmins = admins.length;
        const totalNormais = membros.length;
        
        const allIds = participantes.map(p => p.id);
        
        const grupoNome = metadata.subject || 'Grupo';
        const dataAtual = new Date().toLocaleDateString('pt-BR');
        const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        const mensagemBase = `开启 ${CONFIG.botNome} - 📢 MARCA TODOS 〛
╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ 🏠 ${grupoNome}
┃ 📅 ${dataAtual} | 🕐 ${horaAtual}
╰━━━━━━━━━━━━━━━━━━━━━⬢

📊 ESTATÍSTICAS
┃ 👥 Total: ${totalMembros} membros
┃ 👑 ADMs: ${totalAdmins}
┃ 👤 Membros: ${totalNormais}

🔔 ATENÇÃO!
┃

━━━━━━━━━━━━━━━━━━━━━⬢
👥 MEMBROS:`;

        const MAX_MENCOES = 120;
        const totalParts = Math.ceil(allIds.length / MAX_MENCOES);
        
        function gerarListaMembros(ids) {
            let lista = '';
            for (const id of ids) {
                const nome = id.split('@')[0];
                lista += `@${nome}\n`;
            }
            return lista;
        }
        
        if (totalParts === 1) {
            const listaMembros = gerarListaMembros(allIds);
            
            const textoFinal = `${mensagemBase}\n\n${listaMembros}\n╰━━━━━━━━━━━━━━━━━━━━━⬢\n『 ${CONFIG.botNome} 』`;
            
            await sock.sendMessage(chat, {
                text: textoFinal,
                mentions: allIds
            }, { quoted: msg });
            
        } else {
            await enviarResposta(chat, sock, `📢 Grupo com ${totalMembros} membros! Enviando em ${totalParts} partes...`, msg);
            
            for (let i = 0; i < totalParts; i++) {
                const inicio = i * MAX_MENCOES;
                const fim = Math.min(inicio + MAX_MENCOES, allIds.length);
                const parteMembros = allIds.slice(inicio, fim);
                const parteNumero = i + 1;
                
                const listaMembros = gerarListaMembros(parteMembros);
                
                const textoParte = `开启 ${CONFIG.botNome} - 📢 MARCA TODOS 〛
╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ 📌 Parte ${parteNumero}/${totalParts}
┃ 👥 ${parteMembros.length} membros
╰━━━━━━━━━━━━━━━━━━━━━⬢

${listaMembros}
╰━━━━━━━━━━━━━━━━━━━━━⬢
『 ${CONFIG.botNome} 』`;

                await sock.sendMessage(chat, {
                    text: textoParte,
                    mentions: parteMembros
                }, { quoted: msg });
                
                if (i < totalParts - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
            }
        }
        
        await reagir(sock, chat, msg.key.id, '✅');
        
    } catch (error) {
        console.error('❌ Erro no marca todos:', error);
        await enviarResposta(chat, sock, `❌ Erro: ${error.message}`, msg);
        await reagir(sock, chat, msg.key.id, '❌');
    }
}

// ==================== COMANDO °MARCARADM ====================
async function cmdMarcarAdm(chat, sock, sender, msg) {
    const isAdmin = await verificarAdmin(sock, chat, sender);
    const isDonoBot = await isDono(sender);
    
    if (!isAdmin && !isDonoBot) {
        await enviarResposta(chat, sock, '🚫 Apenas administradores!', msg);
        return;
    }

    await reagir(sock, chat, msg.key.id, '👑');

    try {
        const metadata = await sock.groupMetadata(chat);
        const admins = metadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
        
        if (admins.length === 0) {
            await enviarResposta(chat, sock, '📊 Nenhum administrador encontrado!', msg);
            return;
        }
        
        const adminIds = admins.map(p => p.id);
        const grupoNome = metadata.subject || 'Grupo';
        
        let listaAdms = '';
        for (const id of adminIds) {
            const nome = id.split('@')[0];
            listaAdms += `@${nome}\n`;
        }
        
        const texto = `开启 ${CONFIG.botNome} - 👑 ADMINS 〛
╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ 🏠 ${grupoNome}
┃ 👑 ${admins.length} administradores
╰━━━━━━━━━━━━━━━━━━━━━⬢

${listaAdms}
╰━━━━━━━━━━━━━━━━━━━━━⬢
『 ${CONFIG.botNome} 』`;

        await sock.sendMessage(chat, {
            text: texto,
            mentions: adminIds
        }, { quoted: msg });
        
        await reagir(sock, chat, msg.key.id, '✅');
        
    } catch (error) {
        console.error('❌ Erro:', error);
        await enviarResposta(chat, sock, `❌ Erro: ${error.message}`, msg);
        await reagir(sock, chat, msg.key.id, '❌');
    }
}

// ==================== AFK ====================
async function setAfk(chat, sender, motivo, sock, msg) {
  if (!db.afk) db.afk = {};
  if (!db.afk[chat]) db.afk[chat] = {};
  
  db.afk[chat][sender] = {
    motivo: motivo || "Não informado",
    timestamp: Date.now()
  };
  
  salvarDB();
  
  const texto = `开启 ${CONFIG.botNome} - AFK 〛\n╭━━━━━━━━━━━━━⬢\n┃ 👤 @${sender.split('@')[0]}\n┃ 🔕 Está AFK\n┃ 💬 ${motivo || "Não informado"}\n╰━━━━━━━━━━━━━⬢`;
  
  await enviarResposta(chat, sock, texto, msg, [sender]);
}

async function removerAfk(chat, sender, sock, msg) {
  if (!db.afk?.[chat]?.[sender]) return false;
  
  const tempoAfk = Date.now() - db.afk[chat][sender].timestamp;
  const minutos = Math.floor(tempoAfk / 60000);
  
  delete db.afk[chat][sender];
  if (Object.keys(db.afk[chat]).length === 0) delete db.afk[chat];
  salvarDB();
  
  const texto = `开启 ${CONFIG.botNome} 〛\n╭━━━━━━━━━━━━━⬢\n┃ 👤 @${sender.split('@')[0]}\n┃ 🟢 Saiu do AFK\n┃ ⏱️ ${minutos} minuto(s)\n╰━━━━━━━━━━━━━⬢`;
  
  await enviarResposta(chat, sock, texto, msg, [sender]);
  return true;
}

async function verificarAfk(chat, sender, mencionados, sock, msg) {
  if (!db.afk?.[chat]) return false;
  
  for (const mencionado of mencionados) {
    if (db.afk[chat][mencionado]) {
      const data = db.afk[chat][mencionado];
      const tempo = Math.floor((Date.now() - data.timestamp) / 60000);
      
      const texto = `开启 ${CONFIG.botNome} - AFK 〛\n╭━━━━━━━━━━━━━⬢\n┃ 👤 @${mencionado.split('@')[0]}\n┃ 🔕 Ausente\n┃ 💬 ${data.motivo}\n┃ ⏰ ${tempo} minuto(s)\n╰━━━━━━━━━━━━━⬢`;
      
      await enviarResposta(chat, sock, texto, msg, [mencionado]);
      return true;
    }
  }
  
  if (db.afk[chat][sender]) {
    await removerAfk(chat, sender, sock, msg);
  }
  
  return false;
}

// ==================== PERFIL COMPLETO ====================
async function perfil(sock, chat, sender, msg, alvo) {
  const target = alvo || sender;
  const nome = target.split('@')[0];
  
  let foto = null;
  try {
    foto = await sock.profilePictureUrl(target, 'image');
  } catch (err) {
    foto = getFotoAleatoria();
  }
  
  const gay = Math.floor(Math.random() * 101);
  const corno = Math.floor(Math.random() * 101);
  const lindo = Math.floor(Math.random() * 101);
  const feio = Math.floor(Math.random() * 101);
  const inteligente = Math.floor(Math.random() * 101);
  const legal = Math.floor(Math.random() * 101);
  const bemMal = Math.random() < 0.5 ? '😇 Bem' : '😈 Mal';
  
  const barraGay = gerarBarra(gay);
  const barraCorno = gerarBarra(corno);
  const barraLindo = gerarBarra(lindo);
  const barraFeio = gerarBarra(feio);
  const barraInteligente = gerarBarra(inteligente);
  const barraLegal = gerarBarra(legal);
  
  const texto = `开启 ${CONFIG.botNome} - Perfil 〛
╭━━━━━━━━━━━━━⬢
┃ 👤 @${nome}
┃ 🏳️‍🌈 Gay: ${gay}%
┃ ${barraGay}
┃ 🦌 Corno: ${corno}%
┃ ${barraCorno}
┃ ✨ Lindo: ${lindo}%
┃ ${barraLindo}
┃ 👹 Feio: ${feio}%
┃ ${barraFeio}
┃ 🧠 Inteligente: ${inteligente}%
┃ ${barraInteligente}
┃ 🌟 Legal: ${legal}%
┃ ${barraLegal}
┃ ${bemMal}
╰━━━━━━━━━━━━━⬢`;

  if (foto) {
    await sock.sendMessage(chat, { 
      image: { url: foto }, 
      caption: texto, 
      mentions: [target] 
    }, { quoted: msg });
  } else {
    await sock.sendMessage(chat, { 
      text: texto, 
      mentions: [target] 
    }, { quoted: msg });
  }
}

// ==================== COMANDO °CITAR (MÍDIA COMPLETA) ====================

async function cmdCitar(chat, sock, msg, args, sender) {
    // 🔥 VERIFICA SE É ADM OU DONO
    const isAdmin = await verificarAdmin(sock, chat, sender);
    const isDonoBot = await isDono(sender);
    
    if (!isAdmin && !isDonoBot) {
        await enviarResposta(chat, sock, '🚫 Apenas administradores podem usar este comando!', msg);
        return;
    }

    await reagir(sock, chat, msg.key.id, '📢');

    try {
        // ===== PEGA A MENSAGEM RESPONDIDA =====
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        // ===== PEGA TODOS OS MEMBROS DO GRUPO =====
        const metadata = await sock.groupMetadata(chat);
        const participantes = metadata.participants;
        const allIds = participantes.map(p => p.id);
        const totalMembros = allIds.length;
        const MAX_MENCOES = 120;
        const totalParts = Math.ceil(totalMembros / MAX_MENCOES);

        // 🔥 SE TIVER MENSAGEM RESPONDIDA
        if (quoted) {
            // ===== VERIFICA O TIPO DE MÍDIA =====
            const isImage = !!quoted.imageMessage;
            const isVideo = !!quoted.videoMessage;
            const isAudio = !!quoted.audioMessage;
            const isSticker = !!quoted.stickerMessage;
            const isDocument = !!quoted.documentMessage;
            const isText = !!quoted.conversation || !!quoted.extendedTextMessage?.text;

            // ===== PEGA O TEXTO DA MENSAGEM (SE TIVER) =====
            let texto = quoted.conversation || 
                       quoted.extendedTextMessage?.text || 
                       quoted.imageMessage?.caption ||
                       quoted.videoMessage?.caption ||
                       quoted.documentMessage?.fileName ||
                       '';

            // ===== BAIXA A MÍDIA (SE FOR IMAGEM, VÍDEO, ÁUDIO OU STICKER) =====
            if (isImage || isVideo || isAudio || isSticker) {
                const target = { message: quoted, key: msg.key };
                const buffer = await downloadMediaMessage(target, 'buffer', {}, { logger: P({ level: 'silent' }) });

                // ===== ENVIA A MÍDIA PARA TODOS =====
                if (totalParts === 1) {
                    // 🔥 MENOS DE 120 MEMBROS
                    await enviarMidiaComMencao(sock, chat, quoted, buffer, allIds, texto);
                } else {
                    // 🔥 MAIS DE 120 MEMBROS - DIVIDE
                    for (let i = 0; i < totalParts; i++) {
                        const inicio = i * MAX_MENCOES;
                        const fim = Math.min(inicio + MAX_MENCOES, allIds.length);
                        const parteMembros = allIds.slice(inicio, fim);
                        
                        await enviarMidiaComMencao(sock, chat, quoted, buffer, parteMembros, texto);
                        
                        if (i < totalParts - 1) {
                            await new Promise(resolve => setTimeout(resolve, 1500));
                        }
                    }
                }
            } else if (isDocument) {
                // ===== DOCUMENTO (NÃO BAIXA, SÓ REPETE COM MENÇÃO) =====
                if (totalParts === 1) {
                    await sock.sendMessage(chat, {
                        text: `📎 ${quoted.documentMessage?.fileName || 'Documento'}`,
                        mentions: allIds
                    }, { quoted: msg });
                } else {
                    for (let i = 0; i < totalParts; i++) {
                        const inicio = i * MAX_MENCOES;
                        const fim = Math.min(inicio + MAX_MENCOES, allIds.length);
                        const parteMembros = allIds.slice(inicio, fim);
                        
                        await sock.sendMessage(chat, {
                            text: `📎 ${quoted.documentMessage?.fileName || 'Documento'}`,
                            mentions: parteMembros
                        }, { quoted: msg });
                        
                        if (i < totalParts - 1) {
                            await new Promise(resolve => setTimeout(resolve, 1500));
                        }
                    }
                }
            } else if (isText) {
                // ===== TEXTO PURO =====
                const textoParaCitar = texto || 'Mensagem sem texto';
                
                if (totalParts === 1) {
                    await sock.sendMessage(chat, {
                        text: textoParaCitar,
                        mentions: allIds
                    }, { quoted: msg });
                } else {
                    for (let i = 0; i < totalParts; i++) {
                        const inicio = i * MAX_MENCOES;
                        const fim = Math.min(inicio + MAX_MENCOES, allIds.length);
                        const parteMembros = allIds.slice(inicio, fim);
                        
                        await sock.sendMessage(chat, {
                            text: textoParaCitar,
                            mentions: parteMembros
                        }, { quoted: msg });
                        
                        if (i < totalParts - 1) {
                            await new Promise(resolve => setTimeout(resolve, 1500));
                        }
                    }
                }
            }
            
            await reagir(sock, chat, msg.key.id, '✅');
            console.log(`📢 Citação enviada para ${totalMembros} membros`);
            return;
        }

        // ===== SE NÃO TIVER MENSAGEM RESPONDIDA =====
        const textoDigitado = args.join(' ').trim();
        if (!textoDigitado) {
            await enviarResposta(chat, sock, `📌 Use: ${CONFIG.prefix}citar <mensagem>\n📌 Ou: ${CONFIG.prefix}citar (respondendo uma mensagem)`, msg);
            await reagir(sock, chat, msg.key.id, '❌');
            return;
        }

        // ===== ENVIA O TEXTO COM MENÇÃO =====
        if (totalParts === 1) {
            await sock.sendMessage(chat, {
                text: textoDigitado,
                mentions: allIds
            }, { quoted: msg });
        } else {
            for (let i = 0; i < totalParts; i++) {
                const inicio = i * MAX_MENCOES;
                const fim = Math.min(inicio + MAX_MENCOES, allIds.length);
                const parteMembros = allIds.slice(inicio, fim);
                
                await sock.sendMessage(chat, {
                    text: textoDigitado,
                    mentions: parteMembros
                }, { quoted: msg });
                
                if (i < totalParts - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
            }
        }

        await reagir(sock, chat, msg.key.id, '✅');
        console.log(`📢 Citação enviada para ${totalMembros} membros`);

    } catch (error) {
        console.error('❌ Erro no citar:', error);
        
        // 🔥 TENTA ENVIAR COMO TEXTO SE FALHAR
        try {
            const texto = args.join(' ').trim() || 'Mensagem citada';
            const metadata = await sock.groupMetadata(chat);
            const participantes = metadata.participants;
            const allIds = participantes.map(p => p.id);
            
            await sock.sendMessage(chat, {
                text: texto,
                mentions: allIds
            }, { quoted: msg });
            
            await reagir(sock, chat, msg.key.id, '✅');
        } catch (e) {
            await enviarResposta(chat, sock, `❌ Erro: ${error.message}`, msg);
            await reagir(sock, chat, msg.key.id, '❌');
        }
    }
}

// ==================== FUNÇÃO AUXILIAR PARA ENVIAR MÍDIA ====================

async function enviarMidiaComMencao(sock, chat, quoted, buffer, mentions, texto) {
    const isImage = !!quoted.imageMessage;
    const isVideo = !!quoted.videoMessage;
    const isAudio = !!quoted.audioMessage;
    const isSticker = !!quoted.stickerMessage;

    let mimeType = '';
    let mediaType = '';

    if (isImage) {
        mimeType = quoted.imageMessage?.mimetype || 'image/jpeg';
        mediaType = 'image';
    } else if (isVideo) {
        mimeType = quoted.videoMessage?.mimetype || 'video/mp4';
        mediaType = 'video';
    } else if (isAudio) {
        mimeType = quoted.audioMessage?.mimetype || 'audio/ogg; codecs=opus';
        mediaType = 'audio';
    } else if (isSticker) {
        mediaType = 'sticker';
    }

    // 🔥 CORTA O TEXTO SE FOR MUITO LONGO (PARA CABER NA LEGENDA)
    let caption = texto || '';
    if (caption.length > 1000) {
        caption = caption.slice(0, 997) + '...';
    }

    const msgOptions = {
        mentions: mentions
    };

    // 🔥 ADICIONA LEGENDA SE TIVER TEXTO
    if (caption && (isImage || isVideo)) {
        msgOptions.caption = caption;
    }

    if (isImage) {
        await sock.sendMessage(chat, {
            image: buffer,
            ...msgOptions
        }, { quoted: { message: quoted, key: { id: '' } } });
    } else if (isVideo) {
        await sock.sendMessage(chat, {
            video: buffer,
            mimetype: mimeType,
            ...msgOptions
        }, { quoted: { message: quoted, key: { id: '' } } });
    } else if (isAudio) {
        await sock.sendMessage(chat, {
            audio: buffer,
            mimetype: mimeType,
            ptt: true,
            ...msgOptions
        }, { quoted: { message: quoted, key: { id: '' } } });
    } else if (isSticker) {
        await sock.sendMessage(chat, {
            sticker: buffer,
            ...msgOptions
        }, { quoted: { message: quoted, key: { id: '' } } });
    }
}

// ==================== CRIAR FIGURINHA ====================
async function criarFigurinha(chat, sock, sender, msg) {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    
    if (!quoted || (!quoted.imageMessage && !quoted.videoMessage)) {
        await enviarResposta(chat, sock, '⚠️ Responda a uma imagem ou vídeo (até 10s)!', msg);
        return;
    }
    
    const isImage = !!quoted.imageMessage;
    const isVideo = !!quoted.videoMessage;
    
    if (isVideo) {
        const seconds = quoted.videoMessage?.seconds;
        if (seconds > 10) {
            await enviarResposta(chat, sock, '⚠️ O vídeo tem mais de 10 segundos!', msg);
            return;
        }
    }
    
    await reagir(sock, chat, msg.key.id, '⏳');
    
    try {
        // ===== FUNÇÃO PARA BAIXAR IMAGEM =====
        const downloadImage = async (webMsg, getRandomName) => {
            const target = { message: webMsg.message || webMsg, key: msg.key };
            const buffer = await downloadMediaMessage(target, 'buffer', {}, { logger: P({ level: 'silent' }) });
            const filePath = path.join(PASTAS.temp, getRandomName('png'));
            fs.writeFileSync(filePath, buffer);
            return filePath;
        };
        
        // ===== FUNÇÃO PARA BAIXAR VÍDEO =====
        const downloadVideo = async (webMsg, getRandomName) => {
            const target = { message: webMsg.message || webMsg, key: msg.key };
            const buffer = await downloadMediaMessage(target, 'buffer', {}, { logger: P({ level: 'silent' }) });
            const filePath = path.join(PASTAS.temp, getRandomName('mp4'));
            fs.writeFileSync(filePath, buffer);
            return filePath;
        };
        
        // ===== FUNÇÃO PARA ENVIAR STICKER =====
        // 🔥 O createSticker espera sendFn(filePath, true)
        const sendStickerFromFile = async (filePath) => {
            const buffer = fs.readFileSync(filePath);
            await sock.sendMessage(chat, { sticker: buffer }, { quoted: msg });
        };
        
        // 🔥 CHAMA O createSticker
        await createSticker({
            isImage,
            isVideo,
            downloadImage,
            downloadVideo,
            webMessage: { 
                message: quoted, 
                key: msg.key,
                pushName: msg.pushName || null
            },
            sendStickerFromFile,
            userLid: sender,
            metadataCustom: {} // DEIXA VAZIO PARA USAR O PADRÃO
        });
        
        await reagir(sock, chat, msg.key.id, '✅');
        
    } catch (err) {
        console.error('❌ Erro ao criar sticker:', err);
        await enviarResposta(chat, sock, `❌ ${err.message}`, msg);
        await reagir(sock, chat, msg.key.id, '❌');
    }
}

// ==================== INTERAÇÕES ====================
async function setInteractionGif(chat, sock, sender, args, acao, msg) {
  if (!await isDono(sender)) {
    await enviarResposta(chat, sock, '🔒 Apenas o dono!', msg);
    return;
  }
  
  const url = args[0];
  if (!url || !url.startsWith('http')) {
    await enviarResposta(chat, sock, `⚠️ Envie o link direto do vídeo/GIF (máx 10s):\n${CONFIG.prefix}set${acao} <url>`, msg);
    return;
  }
  
  try {
    const tempPath = path.join(PASTAS.temp, `temp_${acao}_${Date.now()}.mp4`);
    await execAsync(`yt-dlp -f "best[ext=mp4]" --no-playlist --no-warnings -o "${tempPath}" "${url}"`);
    
    const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${tempPath}"`);
    const duration = parseFloat(stdout);
    if (duration > 10) {
      fs.unlinkSync(tempPath);
      await enviarResposta(chat, sock, '⚠️ O vídeo tem mais de 10 segundos!', msg);
      return;
    }
    
    const gifPath = path.join(PASTAS.temp, `${acao}_${Date.now()}.mp4`);
    fs.renameSync(tempPath, gifPath);
    
    if (db.interactionGifs[acao] && fs.existsSync(db.interactionGifs[acao])) {
      fs.unlinkSync(db.interactionGifs[acao]);
    }
    
    db.interactionGifs[acao] = gifPath;
    salvarDB();
    await enviarResposta(chat, sock, `✅ GIF para *${acao}* definido!`, msg);
  } catch (err) {
    console.error(err);
    await enviarResposta(chat, sock, '❌ Falha ao baixar o vídeo!', msg);
  }
}

async function interacao(chat, sock, sender, msg, alvo, acao, frases) {
    if (!alvo) {
        await enviarResposta(chat, sock, `⚠️ Marque alguém: ${CONFIG.prefix}${acao} @user`, msg);
        return;
    }
    if (alvo === sender) {
        await enviarResposta(chat, sock, `❌ Não pode ${acao} si mesmo!`, msg);
        return;
    }
    if (await isDono(alvo)) {
        await alertarContraDono(chat, sock, msg);
        return;
    }

    const frase = frases[Math.floor(Math.random() * frases.length)];
    const gifPath = db.interactionGifs[acao];

    // 🔥 EXTRAI SÓ OS NÚMEROS PARA O TEXTO (SEM @)
    const nomeSender = sender.split('@')[0];
    const nomeAlvo = alvo.split('@')[0];

    // 🔥 CONSTRÓI O TEXTO COM @ (APENAS O NÚMERO)
    const texto = `╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ 💥 **${acao.toUpperCase()}**
╰━━━━━━━━━━━━━━━━━━━━━⬢

@${nomeSender} ${frase} @${nomeAlvo}

╰━━━━━━━━━━━━━━━━━━━━━⬢
『 ${CONFIG.botNome} 』`;

    // 🔥 ENVIA COM MENSÃO CORRETA
    if (gifPath && fs.existsSync(gifPath)) {
        await sock.sendMessage(chat, {
            video: { url: gifPath },
            gifPlayback: true,
            caption: texto,
            mentions: [sender, alvo]  // 🔥 AQUI VAI O JID COMPLETO
        }, { quoted: msg });
    } else {
        await sock.sendMessage(chat, {
            text: texto,
            mentions: [sender, alvo]  // 🔥 AQUI VAI O JID COMPLETO
        }, { quoted: msg });
    }
}

// ==================== COMANDOS ADMIN ====================
async function mutar(sock, chat, alvo, msg) {
  if (!db.mutados[chat]) db.mutados[chat] = [];
  if (!db.mutados[chat].includes(alvo)) {
    db.mutados[chat].push(alvo);
    salvarDB();
    await enviarResposta(chat, sock, `🔇 @${alvo.split('@')[0]} mutado!`, msg, [alvo]);
  }
}

async function desmutar(sock, chat, alvo, msg) {
  if (db.mutados[chat] && db.mutados[chat].includes(alvo)) {
    db.mutados[chat] = db.mutados[chat].filter(id => id !== alvo);
    salvarDB();
    await enviarResposta(chat, sock, `🔊 @${alvo.split('@')[0]} desmutado!`, msg, [alvo]);
  }
}

async function deletarMensagem(sock, chat, msg) {
  try {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) throw new Error();
    const key = {
      remoteJid: chat,
      fromMe: false,
      id: msg.message.extendedTextMessage.contextInfo.stanzaId,
      participant: msg.message.extendedTextMessage.contextInfo.participant
    };
    await sock.sendMessage(chat, { delete: key });
    await enviarResposta(chat, sock, '🗑️ Mensagem apagada!', msg);
  } catch {
    await enviarResposta(chat, sock, '❌ Não foi possível apagar!', msg);
  }
}

// ==================== VERIFICAR SE É DONO ====================
async function isDono(sender) {
    try {
        const senderId = sender.split('@')[0];
        
        // 🔥 VERIFICA NA LISTA DE DONOS DO CONFIG
        if (CONFIG.donos && Array.isArray(CONFIG.donos)) {
            for (const dono of CONFIG.donos) {
                if (senderId === dono || senderId.includes(dono) || dono.includes(senderId)) {
                    console.log(`✅ Dono encontrado: ${dono} (sender: ${senderId})`);
                    return true;
                }
            }
        }
        
        console.log(`❌ Não é dono (sender: ${senderId})`);
        return false;
        
    } catch (error) {
        console.error('❌ Erro ao verificar dono:', error);
        return false;
    }
}

// ==================== ADICIONAR DONO (APENAS DONO ORIGINAL) ====================
async function adicionarDono(chat, sock, sender, alvo, msg) {
    // 🔥 APENAS O DONO ORIGINAL PODE ADICIONAR
    if (sender.split('@')[0] !== CONFIG.donoOriginal) {
        await enviarResposta(chat, sock, '🔒 Apenas o dono original pode adicionar donos!', msg);
        return;
    }
    
    if (!alvo) {
        await enviarResposta(chat, sock, `⚠️ Marque alguém: ${CONFIG.prefix}adddono @user`, msg);
        return;
    }
    
    const alvoId = alvo.split('@')[0];
    
    if (alvoId === CONFIG.donoOriginal) {
        await enviarResposta(chat, sock, '👑 Ele já é o dono original!', msg);
        return;
    }
    
    // 🔥 VERIFICA SE JÁ É DONO
    if (Array.isArray(CONFIG.donos) && CONFIG.donos.includes(alvoId)) {
        await enviarResposta(chat, sock, `⚠️ @${alvoId} já é dono!`, msg, [alvo]);
        return;
    }
    
    // 🔥 ADICIONA AO CONFIG
    if (!Array.isArray(CONFIG.donos)) CONFIG.donos = [];
    CONFIG.donos.push(alvoId);
    
    // 🔥 SALVA NO ARQUIVO
    try {
        const fs = require('fs');
        const configPath = path.join(__dirname, 'config.js');
        let configContent = fs.readFileSync(configPath, 'utf8');
        
        // Atualiza o array de donos no config.js
        const donosStr = JSON.stringify(CONFIG.donos, null, 4);
        const newConfigContent = configContent.replace(
            /donos:\s*\[[^\]]*\]/,
            `donos: ${donosStr}`
        );
        fs.writeFileSync(configPath, newConfigContent);
        
        await enviarResposta(chat, sock, `👑 @${alvoId} agora é dono!\n📌 Adicionado ao config.js`, msg, [alvo]);
    } catch (err) {
        console.error('❌ Erro ao salvar config:', err);
        await enviarResposta(chat, sock, `❌ Erro ao salvar: ${err.message}`, msg);
    }
}

// ==================== REMOVER DONO (APENAS DONO ORIGINAL) ====================
async function removerDono(chat, sock, sender, alvo, msg) {
    // 🔥 APENAS O DONO ORIGINAL PODE REMOVER
    if (sender.split('@')[0] !== CONFIG.donoOriginal) {
        await enviarResposta(chat, sock, '🔒 Apenas o dono original pode remover donos!', msg);
        return;
    }
    
    if (!alvo) {
        await enviarResposta(chat, sock, `⚠️ Marque alguém: ${CONFIG.prefix}removerdono @user`, msg);
        return;
    }
    
    const alvoId = alvo.split('@')[0];
    
    if (alvoId === CONFIG.donoOriginal) {
        await enviarResposta(chat, sock, '👑 Não é possível remover o dono original!', msg);
        return;
    }
    
    if (!Array.isArray(CONFIG.donos) || !CONFIG.donos.includes(alvoId)) {
        await enviarResposta(chat, sock, `⚠️ @${alvoId} não é dono!`, msg, [alvo]);
        return;
    }
    
    // 🔥 REMOVE DO CONFIG
    CONFIG.donos = CONFIG.donos.filter(id => id !== alvoId);
    
    // 🔥 SALVA NO ARQUIVO
    try {
        const fs = require('fs');
        const configPath = path.join(__dirname, 'config.js');
        let configContent = fs.readFileSync(configPath, 'utf8');
        
        const donosStr = JSON.stringify(CONFIG.donos, null, 4);
        const newConfigContent = configContent.replace(
            /donos:\s*\[[^\]]*\]/,
            `donos: ${donosStr}`
        );
        fs.writeFileSync(configPath, newConfigContent);
        
        await enviarResposta(chat, sock, `👋 @${alvoId} removido dos donos!`, msg, [alvo]);
    } catch (err) {
        console.error('❌ Erro ao salvar config:', err);
        await enviarResposta(chat, sock, `❌ Erro ao salvar: ${err.message}`, msg);
    }
}

// ==================== VERIFICAR SE É DONO ====================
async function isDono(sender) {
    try {
        const senderId = sender.split('@')[0];
        
        // 🔥 LISTA DE TODOS OS DONOS (CONFIG + DB)
        const todosDonos = [
            CONFIG.donoOriginal,
            ...(Array.isArray(CONFIG.donos) ? CONFIG.donos : []),
            ...(Array.isArray(db.donos) ? db.donos : [])
        ];
        
        // 🔥 VERIFICA SE O senderId CORRESPONDE A ALGUM DONO
        for (const dono of todosDonos) {
            if (senderId === dono || senderId.includes(dono) || dono.includes(senderId)) {
                return true;
            }
        }
        
        return false;
        
    } catch (error) {
        console.error('❌ Erro ao verificar dono:', error);
        return false;
    }
}

// ==================== LISTAR DONOS ====================
async function listarDonos(chat, sock, msg) {
    let texto = `╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ 👑 DONOS DO BOT
╰━━━━━━━━━━━━━━━━━━━━━⬢

👑 Dono Original: @${CONFIG.donoOriginal}\n`;

    // 🔥 MOSTRA DONOS DO CONFIG
    if (Array.isArray(CONFIG.donos) && CONFIG.donos.length > 0) {
        texto += `\n📋 Donos adicionais:\n`;
        for (const dono of CONFIG.donos) {
            if (dono !== CONFIG.donoOriginal) {
                texto += `┃ 👤 @${dono}\n`;
            }
        }
    } else {
        texto += `\n📋 Nenhum dono adicional configurado.\n`;
    }

    texto += `\n╰━━━━━━━━━━━━━━━━━━━━━⬢
『 ${CONFIG.botNome} 』`;

    // 🔥 MENCIONA TODOS OS DONOS
    const mentions = [CONFIG.donoOriginal + '@s.whatsapp.net'];
    if (Array.isArray(CONFIG.donos)) {
        for (const dono of CONFIG.donos) {
            if (dono !== CONFIG.donoOriginal) {
                mentions.push(dono + '@s.whatsapp.net');
            }
        }
    }

    await sock.sendMessage(chat, { text: texto, mentions }, { quoted: msg });
}

// ==================== REGRAS ====================
async function setRegras(chat, sock, sender, args, msg) {
  const pode = await podeComandoAdmin(sock, chat, sender);
  if (!pode) {
    await enviarResposta(chat, sock, '🚫 Apenas administradores!', msg);
    return;
  }
  
  const regrasTexto = args.join(' ').trim();
  if (!regrasTexto) {
    await enviarResposta(chat, sock, `📝 Use: ${CONFIG.prefix}setregras <texto>`, msg);
    return;
  }
  
  db.regras[chat] = regrasTexto;
  salvarDB();
  await enviarResposta(chat, sock, '✅ Regras definidas!', msg);
}

async function verRegras(chat, sock, msg) {
  const regras = db.regras[chat];
  if (!regras) {
    await enviarResposta(chat, sock, '📜 Nenhuma regra definida!', msg);
    return;
  }
  
  try {
    const metadata = await sock.groupMetadata(chat);
    let fotoGrupo = null;
    try { fotoGrupo = await sock.profilePictureUrl(chat, 'image'); } catch (err) {}
    
    const texto = `开启 ${CONFIG.botNome} - Regras 〛\n╭━━━━━━━━━━━━━⬢\n┃ 🏠 ${metadata.subject}\n┃ 📜 ${regras}\n╰━━━━━━━━━━━━━⬢`;
    
    if (fotoGrupo) {
      await sock.sendMessage(chat, { image: { url: fotoGrupo }, caption: texto }, { quoted: msg });
    } else {
      await sock.sendMessage(chat, { text: texto }, { quoted: msg });
    }
  } catch (err) {
    await enviarResposta(chat, sock, `📜 ${regras}`, msg);
  }
}

// ==================== ARTE DO BOT ====================
function mostrarArte() {
    const chalk = require('chalk');
    console.clear();
    console.log(chalk.hex('#FFF59D')('     ██╗██╗   ██╗███████╗██╗   ██╗███████╗██╗   ██╗'));
    console.log(chalk.hex('#FFE082')('     ██║██║   ██║██╔════╝██║   ██║██╔════╝██║   ██║'));
    console.log(chalk.hex('#FFD54F')('     ██║██║   ██║█████╗  ██║   ██║█████╗  ██║   ██║'));
    console.log(chalk.hex('#FFC107')('██╗  ██║██║   ██║██╔══╝  ██║   ██║██╔══╝  ██║   ██║'));
    console.log(chalk.hex('#FFB300')('╚█████╔╝╚██████╔╝██║     ╚██████╔╝██║     ╚██████╔╝'));
    console.log(chalk.hex('#FF8F00')(' ╚════╝  ╚═════╝ ╚═╝      ╚═════╝ ╚═╝      ╚═════╝'));
    console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.white(`🤖 BOT: ${CONFIG.botNome} ULTRA`));
    console.log(chalk.yellow(`👑 Dono: ${CONFIG.donoOriginal}`));
    console.log(chalk.hex('#FFD54F')(`✨ Versão: ${CONFIG.versao}`));
    console.log(chalk.hex('#FFCA28')(`📊 Comandos: 25+`));
    console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
}

// ==================== CHAMAR A ARTE ====================
mostrarArte();

// ================================================================
// 🔥 CARREGAR AGENDAMENTOS
// ================================================================

function carregarAgendamentosInicial(sock) {
    const agendamentos = carregarAgendamentos();
    const total = Object.keys(agendamentos).length;
    console.log(`📅 ${total} grupos com agendamentos carregados`);
    
    if (total > 0) {
        for (const [chat, agenda] of Object.entries(agendamentos)) {
            let msg = `📅 ${chat.split('@')[0]}:`;
            if (agenda.fechar) msg += ` 🔒 ${agenda.fechar.horario}`;
            if (agenda.abrir) msg += ` 🔓 ${agenda.abrir.horario}`;
            console.log(msg);
        }
    }
}

// ================================================================
// 🔥 CONFIGURAR EVENTOS
// ================================================================

function configurarEventos(sock) {
    console.log('📅 Configurando eventos...');

// ==================== EVENTO: ENTRADA/SAÍDA ====================
sock.ev.on("group-participants.update", async (update) => {
    const { id, participants, action } = update;
    
    for (const p of participants) {
        if (action === 'add') {
            await enviarBoasVindas(sock, id, p, db, CONFIG);
        } else if (action === 'remove') {
            await enviarSaida(sock, id, p, db, CONFIG);
        }
    }
});

    sock.ev.on('messages.upsert', async ({ messages }) => {
        if (!sock) return;
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        
        const chat = msg.key.remoteJid;
        const sender = msg.key.participant || chat;
        const msgId = msg.key.id;
        
        if (!chat.endsWith('@g.us')) {
            await marcarComoLida(sock, msg);
            return;
        }
        
        await marcarComoLida(sock, msg);
        await contarMensagem(chat, sender, msg, sock);

        const texto = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();
        const textoOriginal = texto.toLowerCase();
        
        const mencionados = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        await verificarAfk(chat, sender, mencionados, sock, msg);

        if (db.mutados[chat] && db.mutados[chat].includes(sender)) {
            try { await sock.sendMessage(chat, { delete: msg.key }); } catch(e) {}
            return;
        }
        
        await antiLink(sock, chat, sender, texto, msg);
        
// ===== ANTI-MÍDIA =====
        await processarAntiMidia(sock, chat, sender, msg, db, enviarResposta, verificarAdmin, isDono);

        const isComando = texto.startsWith(CONFIG.prefix);
        if (!isComando && chat.endsWith('@g.us')) {
            try {
                const processado = await processarAntiPalavrao(
                    sock, chat, sender, msg, db, salvarDB, enviarResposta, reagir, verificarAdmin, isDono, podeBanir
                );
                if (processado) return;
            } catch (err) {
                console.error('❌ Erro no anti-palavrão:', err.message);
            }
        }

      // ===== COMANDO PREFIXO =====
      if (textoOriginal === 'prefixo' || textoOriginal === 'prefix') {
        const resposta = `开启 ${CONFIG.botNome} 〛\n╭━━━━━━━━━━━━━⬢\n┃ 🔖 Prefixo: ${CONFIG.prefix}\n┃ 🤖 Bot: ${CONFIG.botNome}\n╰━━━━━━━━━━━━━⬢`;
        await sock.sendMessage(chat, { text: resposta }, { quoted: msg });
        await reagir(sock, chat, msgId, '🔖');
        return;
      }
      
      if (!texto.startsWith(CONFIG.prefix) && textoOriginal !== 'menu' && textoOriginal !== 'menudono') return;
      
      const isMenu = textoOriginal === 'menu';
      const isMenuDono = textoOriginal === 'menudono';
      let comando, args;
      
      if (isMenu) {
        comando = 'menu';
        args = [];
      } else if (isMenuDono) {
        comando = 'menudono';
        args = [];
      } else {
        const parts = texto.slice(CONFIG.prefix.length).trim().split(/ +/);
        comando = parts[0].toLowerCase();
        args = parts.slice(1);
      }
      
      await reagir(sock, chat, msgId, emojiProcessando);
      
      try {

// ===== MENUS VIA APP =====
     if (comando === 'menu') {
    await enviarMenu(chat, sock, msg);
}
else if (comando === 'menus' || comando === 'listamenus') {
    await enviarMenus(chat, sock, msg);
}
else if (comando === 'menuadm' || comando === 'adm') {
    await enviarMenuAdm(chat, sock, msg);
}
else if (comando === 'menurpg' || comando === 'rpg') {
    await enviarMenuBrincadeira(chat, sock, msg);
}
else if (comando === 'menudono' || comando === 'dono') {
    await enviarMenuDono(chat, sock, msg);
}

// ===== COMANDOS DE MÍDIA DO MENU (SÓ DONO) - VIA APP =====
else if (comando === 'setmenuimage') {
    await tratarComandoMenu({
        comando, chat, sock, msg, sender,
        enviarResposta, verificarAdmin, isDono,
        downloadMediaMessage, P
    });
}
else if (comando === 'setmenuview' || comando === 'setmenuvideo') {
    await tratarComandoMenu({
        comando, chat, sock, msg, sender,
        enviarResposta, verificarAdmin, isDono,
        downloadMediaMessage, P
    });
}
else if (comando === 'setmenuaudio' || comando === 'setmenuaudiodono') {
    await tratarComandoMenu({
        comando, chat, sock, msg, sender,
        enviarResposta, verificarAdmin, isDono,
        downloadMediaMessage, P
    });
}
else if (comando === 'resetmenu') {
    await tratarComandoMenu({
        comando, chat, sock, msg, sender,
        enviarResposta, verificarAdmin, isDono,
        downloadMediaMessage, P
    });
}

// ===== LISTA NEGRA =====
else if (comando === 'addblacklist' || comando === 'addblack' || comando === 'adicionarlista') {
    await cmdBlacklistAdd(sock, chat, sender, msg, args, db, DB_PATH, enviarResposta, reagir, verificarAdmin, isDono, CONFIG);
}
else if (comando === 'removeblacklist' || comando === 'removeblack' || comando === 'removerlista') {
    await cmdBlacklistRemove(sock, chat, sender, msg, args, db, DB_PATH, enviarResposta, reagir, verificarAdmin, isDono, CONFIG);
}
else if (comando === 'blacklist' || comando === 'listanegra' || comando === 'verblacklist') {
    await cmdBlacklistView(sock, chat, sender, msg, args, db, DB_PATH, enviarResposta, reagir, verificarAdmin, isDono, CONFIG);
}

// ===== ANTI-MÍDIA (ADM) =====
else if (comando === 'anti-audio' || comando === 'anti-audios') {
    await cmdAntiAudio(sock, chat, sender, msg, args, db, DB_PATH, enviarResposta, reagir, verificarAdmin, isDono, salvarDB);
}
else if (comando === 'anti-image' || comando === 'anti-img' || comando === 'anti-imagem' || comando === 'anti-imagens') {
    await cmdAntiImage(sock, chat, sender, msg, args, db, DB_PATH, enviarResposta, reagir, verificarAdmin, isDono, salvarDB);
}
else if (comando === 'anti-video' || comando === 'anti-videos') {
    await cmdAntiVideo(sock, chat, sender, msg, args, db, DB_PATH, enviarResposta, reagir, verificarAdmin, isDono, salvarDB);
}
else if (comando === 'anti-sticker' || comando === 'anti-figu' || comando === 'anti-figurinha' || comando === 'anti-figurinhas') {
    await cmdAntiSticker(sock, chat, sender, msg, args, db, DB_PATH, enviarResposta, reagir, verificarAdmin, isDono, salvarDB);
}
else if (comando === 'anti-document' || comando === 'anti-doc' || comando === 'anti-documento' || comando === 'anti-documentos') {
    await cmdAntiDocument(sock, chat, sender, msg, args, db, DB_PATH, enviarResposta, reagir, verificarAdmin, isDono, salvarDB);
}

        // ===== ANTI-LINK =====
        else if (comando === 'antilinkapaga') {
          const pode = await podeComandoAdmin(sock, chat, sender);
          if (!pode) { await enviarResposta(chat, sock, '🚫 Apenas administradores!', msg); await reagir(sock, chat, msgId, emojiErro); return; }
          const acao = args[0]?.toLowerCase();
          if (acao === 'on') { db.antilink[chat] = true; salvarDB(); await enviarResposta(chat, sock, '🔗 Anti-Link (apaga+ban) ATIVADO!', msg); }
          else if (acao === 'off') { db.antilink[chat] = false; salvarDB(); await enviarResposta(chat, sock, '🔗 Anti-Link (apaga+ban) DESATIVADO!', msg); }
          else { await enviarResposta(chat, sock, `📌 Use: ${CONFIG.prefix}antilinkapaga on/off`, msg); }
        }
        else if (comando === 'antilinkban') {
          const pode = await podeComandoAdmin(sock, chat, sender);
          if (!pode) { await enviarResposta(chat, sock, '🚫 Apenas administradores!', msg); await reagir(sock, chat, msgId, emojiErro); return; }
          const acao = args[0]?.toLowerCase();
          if (acao === 'on') { db.antilinkBan[chat] = true; salvarDB(); await enviarResposta(chat, sock, '🔗 Anti-Link (só ban) ATIVADO!', msg); }
          else if (acao === 'off') { db.antilinkBan[chat] = false; salvarDB(); await enviarResposta(chat, sock, '🔗 Anti-Link (só ban) DESATIVADO!', msg); }
          else { await enviarResposta(chat, sock, `📌 Use: ${CONFIG.prefix}antilinkban on/off`, msg); }
        }
        
// ===== PING - SIMPLES E BONITO =====
else if (comando === 'ping') {
    const inicio = Date.now();
    
    try {
        // 🔥 ENVIA A MENSAGEM E MEDE O TEMPO
        const msgEnviada = await sock.sendMessage(chat, {
            text: '🏓'
        }, { quoted: msg });
        
        const latencia = Date.now() - inicio;
        
        // 🔥 TEMPO DE ATIVIDADE DO BOT
        const tempoAtivo = global.inicioBot ? Math.floor((Date.now() - global.inicioBot) / 1000) : 0;
        const dias = Math.floor(tempoAtivo / 86400);
        const horas = Math.floor((tempoAtivo % 86400) / 3600);
        const minutos = Math.floor((tempoAtivo % 3600) / 60);
        const segundos = tempoAtivo % 60;
        
        let tempoStr = '';
        if (dias > 0) tempoStr += `${dias}d `;
        if (horas > 0) tempoStr += `${horas}h `;
        if (minutos > 0) tempoStr += `${minutos}m `;
        tempoStr += `${segundos}s`;
        
        // 🔥 DETERMINA A COR DA LATÊNCIA
        let status = '';
        let cor = '';
        if (latencia <= 300) {
            status = 'Excelente 🟢';
            cor = '🟢';
        } else if (latencia <= 600) {
            status = 'Bom 🟡';
            cor = '🟡';
        } else if (latencia <= 1000) {
            status = 'Regular 🟠';
            cor = '🟠';
        } else {
            status = 'Ruim 🔴';
            cor = '🔴';
        }

        const texto = `╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ 🏓 **PONG!**
╰━━━━━━━━━━━━━━━━━━━━━⬢

┃ 📡 ${latencia}ms
┃ 📊 ${status}

┃ ⏱️ ${tempoStr}

╰━━━━━━━━━━━━━━━━━━━━━⬢
『 ${CONFIG.botNome} 』`;

        await sock.sendMessage(chat, {
            text: texto,
            edit: msgEnviada.key
        });
        
        await reagir(sock, chat, msg.key.id, '✅');
        
    } catch (error) {
        const latencia = Date.now() - inicio;
        await enviarResposta(chat, sock, `🏓 Pong! ${latencia}ms`, msg);
        await reagir(sock, chat, msg.key.id, '❌');
    }
}

        else if (comando === 'afk') {
          const motivo = args.join(' ').trim();
          await setAfk(chat, sender, motivo, sock, msg);
        }
        else if (comando === 'afks' || comando === 'listafk') {
          if (!db.afk?.[chat] || Object.keys(db.afk[chat]).length === 0) {
            await enviarResposta(chat, sock, '📊 Ninguém AFK!', msg);
          } else {
            let textoLista = `开启 ${CONFIG.botNome} - AFKs 〛\n╭━━━━━━━━━━━━━⬢\n`;
            for (const [id, data] of Object.entries(db.afk[chat])) {
              const tempo = Math.floor((Date.now() - data.timestamp) / 60000);
              textoLista += `┃ 👤 @${id.split('@')[0]} - ${data.motivo} (${tempo}m)\n`;
            }
            textoLista += `╰━━━━━━━━━━━━━⬢`;
            const mentions = Object.keys(db.afk[chat]);
            await sock.sendMessage(chat, { text: textoLista, mentions }, { quoted: msg });
          }
        }

// ===== STICKER → GIF =====
else if (comando === 'sticker2gif' || comando === 's2gif' || comando === 'fig2gif') {
    await cmdStickerToGif(sock, chat, sender, msg, args, enviarResposta, reagir, downloadMediaMessage, P, CONFIG);
}

// ===== YOUTUBE =====
else if (comando === 'yt' || comando === 'youtube') {
    await cmdYt(sock, chat, sender, msg, args, enviarResposta, reagir, CONFIG);
}

// ===== PLAY VIA API (IGUAL PINTEREST) =====
else if (comando === 'play') {
    await cmdPlay(sock, chat, msg, args, enviarResposta, reagir, CONFIG);
}

// ===== LIMPAR CACHE DO PLAY =====
else if (comando === 'limparcache' || comando === 'clearcache' || comando === 'limparyt') {
    await cmdLimparCachePlay(sock, chat, msg, args, enviarResposta, reagir, isDono, CONFIG);
}

// ===== STATUS DO CACHE =====
else if (comando === 'cachestatus' || comando === 'statuscache') {
    await cmdCacheStatusPlay(sock, chat, msg, args, enviarResposta, isDono, CONFIG);
}
        // ===== PERFIL =====
        else if (comando === 'perfil' || comando === 'profile') {
          const alvo = await obterMencionado(msg, texto);
          await perfil(sock, chat, sender, msg, alvo);
        }
       
// ===== SHIP =====
else if (comando === 'ship') {
    await cmdShip(sock, chat, sender, msg, args, db, DB_PATH, enviarResposta, reagir);
}
else if (comando === 'shiptop' || comando === 'rankship') {
    await cmdShipTop(sock, chat, msg, db, enviarResposta);
}

// ===== STICKER =====
else if (comando === 'sticker' || comando === 's' || comando === 'fig') {
    await criarFigurinha(chat, sock, sender, msg);
}

// ===== NOMEAR FIGURINHA (SÓ O NOME QUE A PESSOA DIGITOU) =====
else if (comando === 'nomear' || comando === 'name' || comando === 'sticker-name') {
    const nome = args.join(' ').trim();
    if (!nome) {
        await enviarResposta(chat, sock, 
            `📌 Use: ${CONFIG.prefix}nomear <nome da figurinha>\n` +
            `📌 Exemplo: ${CONFIG.prefix}nomear Minha Figurinha`,
            msg
        );
        return;
    }
    
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted || !quoted.stickerMessage) {
        await enviarResposta(chat, sock, '📌 Responda a uma figurinha com °nomear <nome>', msg);
        return;
    }
    
    await reagir(sock, chat, msg.key.id, '⏳');
    
    try {
        const target = { message: quoted, key: msg.key };
        const buffer = await downloadMediaMessage(target, 'buffer', {}, { logger: P({ level: 'silent' }) });
        
        if (!buffer || buffer.length < 100) {
            throw new Error('Figurinha inválida!');
        }
        
        // 🔥 USA O RENAME (SÓ O NOME, SEM AUTOR)
        const stickerBuffer = await renomearFigurinha(buffer, nome);
        
        await sock.sendMessage(chat, { sticker: stickerBuffer }, { quoted: msg });
        await reagir(sock, chat, msg.key.id, '✅');
        await enviarResposta(chat, sock, `✅ Figurinha renomeada para: "${nome}"`, msg);
        
    } catch (error) {
        console.error('❌ Erro ao renomear:', error);
        await enviarResposta(chat, sock, `❌ ${error.message}`, msg);
        await reagir(sock, chat, msg.key.id, '❌');
    }
}

// ===== MYNM (NOME DO WHATSAPP) =====
else if (comando === 'mynm' || comando === 'meunome' || comando === 'my-name') {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted || !quoted.stickerMessage) {
        await enviarResposta(chat, sock, '📌 Responda a uma figurinha com °mynm', msg);
        return;
    }
    
    await reagir(sock, chat, msg.key.id, '⏳');
    
    try {
        const target = { message: quoted, key: msg.key };
        const buffer = await downloadMediaMessage(target, 'buffer', {}, { logger: P({ level: 'silent' }) });
        
        if (!buffer || buffer.length < 100) {
            throw new Error('Figurinha inválida!');
        }
        
        // 🔥 PEGA O NOME DO WHATSAPP
        const nomeUsuario = msg.pushName || sender.split('@')[0];
        
        // 🔥 USA O RENAME (NOME DA PESSOA COMO PACKNAME, SEM AUTOR)
        const stickerBuffer = await renomearFigurinha(buffer, nomeUsuario);
        
        await sock.sendMessage(chat, { sticker: stickerBuffer }, { quoted: msg });
        await reagir(sock, chat, msg.key.id, '✅');
        await enviarResposta(chat, sock, `✅ Figurinha com nome de: ${nomeUsuario}`, msg);
        
    } catch (error) {
        console.error('❌ Erro:', error);
        await enviarResposta(chat, sock, `❌ ${error.message}`, msg);
        await reagir(sock, chat, msg.key.id, '❌');
    }
}

// ===== PERFIL COMPLETO =====
else if (comando === 'sobre-user') {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    let alvo = mentioned[0] || sender;

    // Se tiver argumento, tenta buscar pelo número
    if (args.length > 0) {
        const numero = args[0].replace(/[^0-9]/g, '');
        if (numero) {
            try {
                const metadata = await sock.groupMetadata(chat);
                const encontrado = metadata.participants.find(p => p.id.startsWith(numero));
                if (encontrado) {
                    alvo = encontrado.id;
                }
            } catch (e) {}
        }
    }

    await reagir(sock, chat, msg.key.id, '📋');

    try {
        const profile = await getProfile(sock, chat, alvo, msg);

        const texto = formatarPerfil(profile, CONFIG.botNome, CONFIG.prefix);

        // 🔥 MENCIONA O USUÁRIO
        const mentions = [profile.jid];

        if (profile.foto) {
            const response = await fetch(profile.foto);
            const buffer = Buffer.from(await response.arrayBuffer());

            await sock.sendMessage(chat, {
                image: buffer,
                caption: texto,
                mentions: mentions
            }, { quoted: msg });
        } else {
            await sock.sendMessage(chat, {
                text: texto,
                mentions: mentions
            }, { quoted: msg });
        }

        await reagir(sock, chat, msg.key.id, '✅');

    } catch (error) {
        console.error('❌ Erro no perfil:', error);
        await enviarResposta(chat, sock, `❌ ${error.message}`, msg);
        await reagir(sock, chat, msg.key.id, '❌');
    }
}

// ===== COMANDOS =====
else if (comando === 'rank-feio' || comando === 'rankfeio') {
    await cmdRankFeio(sock, chat, sender, msg, args, db, DB_PATH, enviarResposta, reagir, verificarAdmin, isDono, CONFIG);
}
else if (comando === 'rank-bonito' || comando === 'rankbonito') {
    await cmdRankBonito(sock, chat, sender, msg, args, db, DB_PATH, enviarResposta, reagir, verificarAdmin, isDono, CONFIG);
}
else if (comando === 'rank-corno' || comando === 'rankcorno') {
    await cmdRankCorno(sock, chat, sender, msg, args, db, DB_PATH, enviarResposta, reagir, verificarAdmin, isDono, CONFIG);
}
else if (comando === 'rank-gay' || comando === 'rankgay') {
    await cmdRankGay(sock, chat, sender, msg, args, db, DB_PATH, enviarResposta, reagir, verificarAdmin, isDono, CONFIG);
}
else if (comando === 'rank-fofo' || comando === 'rankfofo') {
    await cmdRankFofo(sock, chat, sender, msg, args, db, DB_PATH, enviarResposta, reagir, verificarAdmin, isDono, CONFIG);
}
else if (comando === 'rank-doido' || comando === 'rankdoido') {
    await cmdRankDoido(sock, chat, sender, msg, args, db, DB_PATH, enviarResposta, reagir, verificarAdmin, isDono, CONFIG);
}
else if (comando === 'setrankimage' || comando === 'set-rank-image') {
    await cmdSetRankImage(sock, chat, sender, msg, args, db, DB_PATH, enviarResposta, reagir, downloadMediaMessage, P, verificarAdmin, isDono);
}
else if (comando === 'baixarrankimages' || comando === 'baixar-rank-images') {
    await cmdBaixarRankImages(sock, chat, sender, msg, args, db, DB_PATH, enviarResposta, reagir, isDono, CONFIG);
}
// ===== COMANDOS DE GRUPO =====

// 📸 Editar foto do grupo (respondendo imagem)
else if (comando === 'setfoto' || comando === 'setphoto' || comando === 'fotogrupo') {
    await cmdSetGroupPhoto(chat, sock, sender, msg, enviarResposta, reagir, downloadMediaMessage, P, CONFIG, verificarAdmin, isDono);
}

// 📝 Editar descrição do grupo
else if (comando === 'setdesc' || comando === 'setdescricao' || comando === 'setdescription') {
    await cmdSetGroupDesc(chat, sock, sender, msg, args, enviarResposta, reagir, CONFIG, verificarAdmin, isDono);
}

// 📋 Ver informações completas do grupo
else if (comando === 'grupoinfo' || comando === 'info' || comando === 'groupinfo' || comando === 'about') {
    await cmdGroupInfo(chat, sock, msg, db, enviarResposta, reagir, CONFIG);
}

// 📝 Ver apenas a descrição
else if (comando === 'descricao' || comando === 'desc' || comando === 'description') {
    await cmdGroupDesc(chat, sock, msg, enviarResposta, CONFIG);
}

// 👑 Ver apenas os administradores
else if (comando === 'admins' || comando === 'administradores' || comando === 'listadm') {
    await cmdGroupAdmins(chat, sock, msg, enviarResposta, CONFIG);
}

// 👥 Ver total de membros
else if (comando === 'membros' || comando === 'members' || comando === 'totalmembros') {
    await cmdGroupMembers(chat, sock, msg, enviarResposta, CONFIG);
}

// 🆔 Ver ID do grupo
else if (comando === 'groupid' || comando === 'idgrupo' || comando === 'id') {
    await cmdGroupId(chat, sock, msg, enviarResposta, CONFIG);
}

// 📅 Ver data de criação
else if (comando === 'cri' || comando === 'created' || comando === 'datacriacao') {
    await cmdGroupCreated(chat, sock, msg, enviarResposta, CONFIG);
}
// ===== CASAMENTO =====
else if (comando === 'pedir' || comando === 'propor') {
    await cmdPedir(sock, chat, sender, msg, args, db, DB_PATH, enviarResposta, reagir);
}
else if (comando === 'aceitar' || comando === 'aceito') {
    await cmdAceitar(sock, chat, sender, msg, args, db, DB_PATH, enviarResposta, reagir);
}
else if (comando === 'recusar' || comando === 'rejeitar') {
    await cmdRecusar(sock, chat, sender, msg, args, db, DB_PATH, enviarResposta, reagir);
}
else if (comando === 'pedidos' || comando === 'propostas') {
    await cmdPedidos(sock, chat, sender, msg, db, enviarResposta);
}
else if (comando === 'casados' || comando === 'casais') {
    await cmdCasados(sock, chat, msg, db, enviarResposta);
}
else if (comando === 'divorciar' || comando === 'divorcio') {
    await cmdDivorciar(sock, chat, sender, msg, args, db, DB_PATH, enviarResposta, reagir);
}
else if (comando === 'amor' || comando === 'love') {
    await cmdAmor(sock, chat, sender, msg, args, db, enviarResposta);
}
else if (comando === 'presentear' || comando === 'presente') {
    await cmdPresentear(sock, chat, sender, msg, args, db, DB_PATH, enviarResposta, reagir);
}

        // ===== RANK =====
        else if (comando === 'rankativo' || comando === 'rank') {
          await mostrarRankAtivo(chat, sock, msg);
        }
        else if (comando === 'meustatus' || comando === 'mystatus') {
          await meuStatus(chat, sock, sender, msg);
        }
        else if (comando === 'resetrankativo') {
          await resetarRankAtivo(chat, sender, sock, msg);
        }

        // ===== REGRAS =====
        else if (comando === 'setregras') {
          await setRegras(chat, sock, sender, args, msg);
        }
        else if (comando === 'regras') {
          await verRegras(chat, sock, msg);
        }
        
// ===== ADICIONAR DONO =====
else if (comando === 'adddono' || comando === 'addowner') {
    // 🔥 APENAS DONOS PODEM ADICIONAR
    if (!await isDono(sender)) {
        await enviarResposta(chat, sock, '🔒 Apenas donos podem adicionar outros donos!', msg);
        await reagir(sock, chat, msg.key.id, '❌');
        return;
    }

    const alvo = await obterMencionado(msg, texto);
    if (!alvo) {
        await enviarResposta(chat, sock, `⚠️ Marque alguém: ${CONFIG.prefix}adddono @user`, msg);
        await reagir(sock, chat, msg.key.id, '❌');
        return;
    }

    const alvoId = alvo.split('@')[0];

    // 🔥 VERIFICA SE JÁ É DONO
    if (Array.isArray(CONFIG.donos) && CONFIG.donos.includes(alvoId)) {
        await enviarResposta(chat, sock, `⚠️ @${alvoId} já é dono!`, msg, [alvo]);
        await reagir(sock, chat, msg.key.id, '❌');
        return;
    }

    // 🔥 ADICIONA AO CONFIG
    if (!Array.isArray(CONFIG.donos)) CONFIG.donos = [];
    CONFIG.donos.push(alvoId);

    // 🔥 SALVA NO ARQUIVO
    try {
        const fs = require('fs');
        const configPath = path.join(__dirname, 'config.js');
        let configContent = fs.readFileSync(configPath, 'utf8');
        
        const donosStr = JSON.stringify(CONFIG.donos, null, 4);
        const newConfigContent = configContent.replace(
            /donos:\s*\[[^\]]*\]/,
            `donos: ${donosStr}`
        );
        fs.writeFileSync(configPath, newConfigContent);
        
        await enviarResposta(chat, sock, `👑 @${alvoId} agora é dono!\n📌 Adicionado ao config.js`, msg, [alvo]);
        await reagir(sock, chat, msg.key.id, '✅');
    } catch (err) {
        console.error('❌ Erro ao salvar config:', err);
        await enviarResposta(chat, sock, `❌ Erro ao salvar: ${err.message}`, msg);
        await reagir(sock, chat, msg.key.id, '❌');
    }
}

// ===== REMOVER DONO =====
else if (comando === 'removerdono' || comando === 'removeowner') {
    // 🔥 APENAS DONOS PODEM REMOVER
    if (!await isDono(sender)) {
        await enviarResposta(chat, sock, '🔒 Apenas donos podem remover donos!', msg);
        await reagir(sock, chat, msg.key.id, '❌');
        return;
    }

    const alvo = await obterMencionado(msg, texto);
    if (!alvo) {
        await enviarResposta(chat, sock, `⚠️ Marque alguém: ${CONFIG.prefix}removerdono @user`, msg);
        await reagir(sock, chat, msg.key.id, '❌');
        return;
    }

    const alvoId = alvo.split('@')[0];

    if (!Array.isArray(CONFIG.donos) || !CONFIG.donos.includes(alvoId)) {
        await enviarResposta(chat, sock, `⚠️ @${alvoId} não é dono!`, msg, [alvo]);
        await reagir(sock, chat, msg.key.id, '❌');
        return;
    }

    // 🔥 REMOVE DO CONFIG
    CONFIG.donos = CONFIG.donos.filter(id => id !== alvoId);

    // 🔥 SALVA NO ARQUIVO
    try {
        const fs = require('fs');
        const configPath = path.join(__dirname, 'config.js');
        let configContent = fs.readFileSync(configPath, 'utf8');
        
        const donosStr = JSON.stringify(CONFIG.donos, null, 4);
        const newConfigContent = configContent.replace(
            /donos:\s*\[[^\]]*\]/,
            `donos: ${donosStr}`
        );
        fs.writeFileSync(configPath, newConfigContent);
        
        await enviarResposta(chat, sock, `👋 @${alvoId} removido dos donos!`, msg, [alvo]);
        await reagir(sock, chat, msg.key.id, '✅');
    } catch (err) {
        console.error('❌ Erro ao salvar config:', err);
        await enviarResposta(chat, sock, `❌ Erro ao salvar: ${err.message}`, msg);
        await reagir(sock, chat, msg.key.id, '❌');
    }
}

// ===== LISTAR DONOS =====
else if (comando === 'listadonos' || comando === 'donos' || comando === 'owners') {
    let texto = `╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ 👑 DONOS DO BOT
╰━━━━━━━━━━━━━━━━━━━━━⬢\n`;

    if (Array.isArray(CONFIG.donos) && CONFIG.donos.length > 0) {
        for (const dono of CONFIG.donos) {
            texto += `┃ 👤 @${dono}\n`;
        }
    } else {
        texto += `┃ 📌 Nenhum dono configurado.\n`;
    }

    texto += `\n╰━━━━━━━━━━━━━━━━━━━━━⬢
『 ${CONFIG.botNome} 』`;

    const mentions = [];
    if (Array.isArray(CONFIG.donos)) {
        for (const dono of CONFIG.donos) {
            mentions.push(dono + '@s.whatsapp.net');
        }
    }

    await sock.sendMessage(chat, { text: texto, mentions }, { quoted: msg });
    await reagir(sock, chat, msg.key.id, '👑');
}
        // ===== ADMIN =====
        else if (comando === 'antipalavrao' || comando === 'ap') {
          await cmdAntiPalavrao(chat, sock, msg, args, sender, db, salvarDB, enviarResposta, verificarAdmin, isDono);
        }
        else if (comando === 'ban' || comando === 'kick' || comando === 'b' || comando === 'vaza') {
          const alvo = await obterMencionado(msg, texto);
          if (!alvo) {
            await enviarResposta(chat, sock, `⚠️ Marque alguém: ${CONFIG.prefix}ban @user`, msg);
            await reagir(sock, chat, msgId, emojiErro);
            return;
          }
          const verificacao = await podeBanir(sock, chat, sender, alvo);
          if (!verificacao.pode) {
            await enviarResposta(chat, sock, verificacao.motivo, msg);
            await reagir(sock, chat, msgId, emojiErro);
            return;
          }
          await sock.groupParticipantsUpdate(chat, [alvo], 'remove');
          await enviarResposta(chat, sock, `🔨 @${alvo.split('@')[0]} foi removido!`, msg, [alvo]);
          await reagir(sock, chat, msgId, emojiSucesso);
        }
        else if (comando === 'promover') {
          const alvo = await obterMencionado(msg, texto);
          if (!await podeComandoAdmin(sock, chat, sender)) {
            await enviarResposta(chat, sock, '🚫 Apenas administradores!', msg);
            await reagir(sock, chat, msgId, emojiErro);
            return;
          }
          if (!alvo) {
            await enviarResposta(chat, sock, `⚠️ Marque alguém: ${CONFIG.prefix}promover @user`, msg);
            await reagir(sock, chat, msgId, emojiErro);
            return;
          }
          if (alvo === sock.user.id) {
            await enviarResposta(chat, sock, '❌ Não posso me promover!', msg);
            await reagir(sock, chat, msgId, emojiErro);
            return;
          }
          await sock.groupParticipantsUpdate(chat, [alvo], 'promote');
          await enviarResposta(chat, sock, `📈 @${alvo.split('@')[0]} promovido!`, msg, [alvo]);
          await reagir(sock, chat, msgId, emojiSucesso);
        }
        else if (comando === 'rebaixar') {
          const alvo = await obterMencionado(msg, texto);
          if (!await podeComandoAdmin(sock, chat, sender)) {
            await enviarResposta(chat, sock, '🚫 Apenas administradores!', msg);
            await reagir(sock, chat, msgId, emojiErro);
            return;
          }
          if (!alvo) {
            await enviarResposta(chat, sock, `⚠️ Marque alguém: ${CONFIG.prefix}rebaixar @user`, msg);
            await reagir(sock, chat, msgId, emojiErro);
            return;
          }
          if (alvo === sock.user.id) {
            await enviarResposta(chat, sock, '❌ Não posso me rebaixar!', msg);
            await reagir(sock, chat, msgId, emojiErro);
            return;
          }
          await sock.groupParticipantsUpdate(chat, [alvo], 'demote');
          await enviarResposta(chat, sock, `📉 @${alvo.split('@')[0]} rebaixado!`, msg, [alvo]);
          await reagir(sock, chat, msgId, emojiSucesso);
        }
        else if (comando === 'fechar') {
          if (!await podeComandoAdmin(sock, chat, sender)) {
            await enviarResposta(chat, sock, '🚫 Apenas administradores!', msg);
            await reagir(sock, chat, msgId, emojiErro);
            return;
          }
          await sock.groupSettingUpdate(chat, 'announcement');
          await enviarResposta(chat, sock, '🔒 Grupo fechado!', msg);
          await reagir(sock, chat, msgId, emojiSucesso);
        }
        else if (comando === 'abrir') {
          if (!await podeComandoAdmin(sock, chat, sender)) {
            await enviarResposta(chat, sock, '🚫 Apenas administradores!', msg);
            await reagir(sock, chat, msgId, emojiErro);
            return;
          }
          await sock.groupSettingUpdate(chat, 'not_announcement');
          await enviarResposta(chat, sock, '🔓 Grupo aberto!', msg);
          await reagir(sock, chat, msgId, emojiSucesso);
        }
        else if (comando === 'mute') {
          const alvo = await obterMencionado(msg, texto);
          if (!await podeComandoAdmin(sock, chat, sender)) {
            await enviarResposta(chat, sock, '🚫 Apenas administradores!', msg);
            await reagir(sock, chat, msgId, emojiErro);
            return;
          }
          if (!alvo) {
            await enviarResposta(chat, sock, `⚠️ Marque alguém: ${CONFIG.prefix}mute @user`, msg);
            await reagir(sock, chat, msgId, emojiErro);
            return;
          }
          await mutar(sock, chat, alvo, msg);
          await reagir(sock, chat, msgId, emojiSucesso);
        }
        else if (comando === 'desmute') {
          const alvo = await obterMencionado(msg, texto);
          if (!await podeComandoAdmin(sock, chat, sender)) {
            await enviarResposta(chat, sock, '🚫 Apenas administradores!', msg);
            await reagir(sock, chat, msgId, emojiErro);
            return;
          }
          if (!alvo) {
            await enviarResposta(chat, sock, `⚠️ Marque alguém: ${CONFIG.prefix}desmute @user`, msg);
            await reagir(sock, chat, msgId, emojiErro);
            return;
          }
          await desmutar(sock, chat, alvo, msg);
          await reagir(sock, chat, msgId, emojiSucesso);
        }
        else if (comando === 'del' || comando === 'apagar') {
          if (!await podeComandoAdmin(sock, chat, sender)) {
            await enviarResposta(chat, sock, '🚫 Apenas administradores!', msg);
            await reagir(sock, chat, msgId, emojiErro);
            return;
          }
          await deletarMensagem(sock, chat, msg);
          await reagir(sock, chat, msgId, emojiSucesso);
        }
        
        // ===== PINTEREST =====
        else if (comando === 'pinterest' || comando === 'pin' || comando === 'pins') {
          await cmdPinterest(sock, chat, msg, args, enviarResposta, reagir, CONFIG);
        }
        
// ===== ALLGLB - ENVIAR PARA TODOS OS GRUPOS =====
else if (comando === 'allglb' || comando === 'allglobal' || comando === 'allgroups') {
    // 🔥 VERIFICA SE É O DONO
    const isDonoBot = await isDono(sender);
    if (!isDonoBot) {
        await enviarResposta(chat, sock, '🔒 Apenas o dono pode usar este comando!', msg);
        await reagir(sock, chat, msg.key.id, '❌');
        return;
    }

    await reagir(sock, chat, msg.key.id, '📢');

    try {
        // 🔥 VERIFICA SE TEM MENSAGEM RESPONDIDA
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        let texto = args.join(' ').trim();
        let isForward = false;
        let quotedMsg = null;

        // 🔥 SE TIVER MENSAGEM RESPONDIDA, USA ELA
        if (quoted) {
            isForward = true;
            quotedMsg = quoted;
            // Se não tiver texto digitado, usa o texto da mensagem respondida como aviso
            if (!texto) {
                texto = '📨 Mensagem encaminhada pelo dono:';
            }
        }

        if (!texto && !isForward) {
            await enviarResposta(chat, sock, `📌 Use: ${CONFIG.prefix}allglb <mensagem>\n📌 Ou responda uma mensagem com ${CONFIG.prefix}allglb`, msg);
            await reagir(sock, chat, msg.key.id, '❌');
            return;
        }

        // 🔥 BUSCA TODOS OS GRUPOS ONDE O BOT ESTÁ
        const groups = await sock.groupFetchAllParticipating();
        const groupIds = Object.keys(groups);

        if (groupIds.length === 0) {
            await enviarResposta(chat, sock, '❌ O bot não está em nenhum grupo!', msg);
            await reagir(sock, chat, msg.key.id, '❌');
            return;
        }

        // 🔥 ENVIA MENSAGEM DE CONFIRMAÇÃO
        const msgConfirm = await enviarResposta(chat, sock, 
            `📢 Enviando para ${groupIds.length} grupos...\n⏱️ Intervalo de 30s entre cada envio.\n📝 "${texto}"`,
            msg
        );

        let enviados = 0;
        let falhas = 0;
        const gruposFalha = [];

        // 🔥 ENVIA PARA CADA GRUPO COM INTERVALO DE 30 SEGUNDOS
        for (let i = 0; i < groupIds.length; i++) {
            const groupId = groupIds[i];
            
            try {
                // 🔥 SE FOR ENCAMINHAMENTO (MENSAGEM RESPONDIDA)
                if (isForward && quotedMsg) {
                    // 🔥 ENCAMINHA A MENSAGEM (NÃO COPIA)
                    await sock.sendMessage(groupId, {
                        forward: {
                            key: msg.key,
                            message: quotedMsg
                        }
                    });
                } else {
                    // 🔥 ENVIA TEXTO NORMAL
                    await sock.sendMessage(groupId, {
                        text: texto
                    });
                }
                
                enviados++;

            } catch (err) {
                falhas++;
                gruposFalha.push(groupId);
                console.error(`❌ Falha ao enviar para ${groupId}:`, err.message);
            }

            // 🔥 INTERVALO DE 30 SEGUNDOS (EXCETO NO ÚLTIMO)
            if (i < groupIds.length - 1) {
                // Atualiza a mensagem de progresso a cada 5 envios
                if ((i + 1) % 5 === 0) {
                    try {
                        await sock.sendMessage(chat, {
                            text: `⏳ Progresso: ${i + 1}/${groupIds.length} grupos...`,
                            edit: msgConfirm.key
                        });
                    } catch (e) {}
                }
                
                // Aguarda 30 segundos antes do próximo envio
                await new Promise(resolve => setTimeout(resolve, 30000));
            }
        }

        // 🔥 MENSAGEM FINAL COM RELATÓRIO
        let resposta = `╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ 📢 MENSAGEM ENVIADA
╰━━━━━━━━━━━━━━━━━━━━━⬢

✅ Enviado para: ${enviados} grupos
❌ Falhas: ${falhas}
📊 Total: ${groupIds.length} grupos

📝 "${texto}"`;

        if (falhas > 0) {
            resposta += `\n\n⚠️ Grupos com falha:\n`;
            for (const id of gruposFalha.slice(0, 5)) {
                resposta += `┃ • ${id.split('@')[0]}\n`;
            }
            if (gruposFalha.length > 5) {
                resposta += `┃ • + ${gruposFalha.length - 5} outros\n`;
            }
        }

        resposta += `\n╰━━━━━━━━━━━━━━━━━━━━━⬢
『 ${CONFIG.botNome} 』`;

        await sock.sendMessage(chat, {
            text: resposta,
            edit: msgConfirm.key
        });
        await reagir(sock, chat, msg.key.id, '✅');

    } catch (error) {
        console.error('❌ Erro no allglb:', error);
        await enviarResposta(chat, sock, `❌ Erro: ${error.message}`, msg);
        await reagir(sock, chat, msg.key.id, '❌');
    }
}

        // ===== AGENDAMENTO =====
        else if (comando === 'agendarfechar' || comando === 'agf') {
          if (!await podeComandoAdmin(sock, chat, sender)) {
            await enviarResposta(chat, sock, '🚫 Apenas administradores!', msg);
            return;
          }
          const hora = parseInt(args[0]);
          const minuto = parseInt(args[1]);
          if (isNaN(hora) || isNaN(minuto) || hora < 0 || hora > 23 || minuto < 0 || minuto > 59) {
            await enviarResposta(chat, sock, `📌 Use: ${CONFIG.prefix}agendarfechar <hora> <minuto>\n📌 Exemplo: ${CONFIG.prefix}agendarfechar 18 00`, msg);
            return;
          }
          await agendarFechamento(chat, sock, hora, minuto, msg);
        }
        else if (comando === 'agendarabrir' || comando === 'aga') {
          if (!await podeComandoAdmin(sock, chat, sender)) {
            await enviarResposta(chat, sock, '🚫 Apenas administradores!', msg);
            return;
          }
          const hora = parseInt(args[0]);
          const minuto = parseInt(args[1]);
          if (isNaN(hora) || isNaN(minuto) || hora < 0 || hora > 23 || minuto < 0 || minuto > 59) {
            await enviarResposta(chat, sock, `📌 Use: ${CONFIG.prefix}agendarabrir <hora> <minuto>\n📌 Exemplo: ${CONFIG.prefix}agendarabrir 07 00`, msg);
            return;
          }
          await agendarAbertura(chat, sock, hora, minuto, msg);
        }
        else if (comando === 'veragenda' || comando === 'vagenda') {
          if (!await podeComandoAdmin(sock, chat, sender)) {
            await enviarResposta(chat, sock, '🚫 Apenas administradores!', msg);
            return;
          }
          await verAgendamentos(chat, sock, msg);
        }
        else if (comando === 'deletaragenda' || comando === 'delagenda') {
          if (!await podeComandoAdmin(sock, chat, sender)) {
            await enviarResposta(chat, sock, '🚫 Apenas administradores!', msg);
            return;
          }
          await deletarAgendamento(chat, sock, args, msg);
        }
        
// ===== STICKER PARA IMAGEM/GIF =====
else if (comando === 'sticker2img' || comando === 's2img' || comando === 'fig2img' || comando === 'sticker2foto') {
    await cmdStickerToMedia(sock, chat, sender, msg, args, enviarResposta, reagir, downloadMediaMessage, P, CONFIG);
}

        // ===== INTERAÇÕES =====
        else if (comando === 'settapa') {
          await setInteractionGif(chat, sock, sender, args, 'tapa', msg);
          await reagir(sock, chat, msgId, emojiSucesso);
        }
        else if (comando === 'setmatar') {
          await setInteractionGif(chat, sock, sender, args, 'matar', msg);
          await reagir(sock, chat, msgId, emojiSucesso);
        }
        else if (comando === 'setbeijar') {
          await setInteractionGif(chat, sock, sender, args, 'beijar', msg);
          await reagir(sock, chat, msgId, emojiSucesso);
        }
        else if (comando === 'setabracar') {
          await setInteractionGif(chat, sock, sender, args, 'abracar', msg);
          await reagir(sock, chat, msgId, emojiSucesso);
        }
        else if (comando === 'setsocar') {
          await setInteractionGif(chat, sock, sender, args, 'socar', msg);
          await reagir(sock, chat, msgId, emojiSucesso);
        }
        else if (comando === 'tapa') {
          const alvo = await obterMencionado(msg, texto);
          await interacao(chat, sock, sender, msg, alvo, 'tapa', ['deu um tapa em', 'tacou um tapão em']);
          await reagir(sock, chat, msgId, emojiSucesso);
        }
        else if (comando === 'matar') {
          const alvo = await obterMencionado(msg, texto);
          await interacao(chat, sock, sender, msg, alvo, 'matar', ['matou', 'assassinou', 'eliminou']);
          await reagir(sock, chat, msgId, emojiSucesso);
        }
        else if (comando === 'beijar') {
          const alvo = await obterMencionado(msg, texto);
          await interacao(chat, sock, sender, msg, alvo, 'beijar', ['beijou', 'deu um beijo em']);
          await reagir(sock, chat, msgId, emojiSucesso);
        }
        else if (comando === 'abraçar' || comando === 'abracar') {
          const alvo = await obterMencionado(msg, texto);
          await interacao(chat, sock, sender, msg, alvo, 'abraçar', ['abraçou', 'deu um abraço em']);
          await reagir(sock, chat, msgId, emojiSucesso);
        }
        else if (comando === 'socar') {
          const alvo = await obterMencionado(msg, texto);
          await interacao(chat, sock, sender, msg, alvo, 'socar', ['socou', 'deu um soco em']);
          await reagir(sock, chat, msgId, emojiSucesso);
        }
        
// ===== WAIFU =====
else if (comando === 'waifu') {
    await cmdWaifu(sock, chat, msg, enviarResposta, reagir, CONFIG);
}

// ===== NEKO =====
else if (comando === 'neko') {
    await cmdNeko(sock, chat, msg, enviarResposta, reagir, CONFIG);
}

// ==================== COMANDO CITAR ====================

// °citar - Marca todos repetindo a mensagem (apenas ADM)
else if (comando === 'citar' || comando === 'cita' || comando === 'citacao') {
    await cmdCitar(chat, sock, msg, args, sender);
}
        
// ===== BOTINFO - INFORMAÇÕES COMPLETAS DO BOT =====
else if (comando === 'bot') {
    await cmdBotInfo(sock, chat, msg, CONFIG, db);
}

        // ===== PORCENTAGENS =====
        else if (comando === 'gay') {
          await cmdPorcentagem(sock, chat, sender, msg, args, 'gay');
        }
        else if (comando === 'corno') {
          await cmdPorcentagem(sock, chat, sender, msg, args, 'corno');
        }
        else if (comando === 'passivo') {
          await cmdPorcentagem(sock, chat, sender, msg, args, 'passivo');
        }
        else if (comando === 'lindo') {
          await cmdPorcentagem(sock, chat, sender, msg, args, 'lindo');
        }
        else if (comando === 'linda') {
          await cmdPorcentagem(sock, chat, sender, msg, args, 'linda');
        }
        else if (comando === 'feio') {
          await cmdPorcentagem(sock, chat, sender, msg, args, 'feio');
        }
        else if (comando === 'feia') {
          await cmdPorcentagem(sock, chat, sender, msg, args, 'feia');
        }
        else if (comando === 'lesbica' || comando === 'lésbica') {
          await cmdPorcentagem(sock, chat, sender, msg, args, 'lesbica');
        }
        else if (comando === 'inteligente') {
          await cmdPorcentagem(sock, chat, sender, msg, args, 'inteligente');
        }
        else if (comando === 'burro') {
          await cmdPorcentagem(sock, chat, sender, msg, args, 'burro');
        }
        else if (comando === 'burra') {
          await cmdPorcentagem(sock, chat, sender, msg, args, 'burra');
        }
        
        // ===== IA =====
        else if (comando === 'img' || comando === 'imagem' || comando === 'image' || comando === 'gerar') {
          await cmdGerarImagem(chat, sock, msg, args, sender);
        }

// ===== RPG - EMPREGO =====
else if (comando === 'trabalhar' || comando === 'work') {
    await trabalhar(sender, sock, chat, msg);
}
else if (comando === 'diaria' || comando === 'diária') {
    await diaria(sender, sock, chat, msg);
}
else if (comando === 'vagas' || comando === 'empregos') {
    await vagasEmprego(sender, sock, chat, msg, args);
}
else if (comando === 'vaga' || comando === 'emprego') {
    await vagasEmprego(sender, sock, chat, msg, args);
}
else if (comando === 'contratar') {
    await contratar(sender, sock, chat, msg, args);
}
else if (comando === 'demitir') {
    await demitir(sender, sock, chat, msg);
}
else if (comando === 'carteira' || comando === 'ctps') {
    await carteira(sender, sock, chat, msg);
}
else if (comando === 'ranktrabalho' || comando === 'rankwork') {
    await rankTrabalho(sock, chat, msg);
}

// ===== RPG - MINERAÇÃO =====
else if (comando === 'minerar' || comando === 'miner') {
    await cmdMinerar(sender, sock, chat, msg);
}
else if (comando === 'comprarpicareta' || comando === 'cpicareta') {
    await cmdComprarPicareta(sender, sock, chat, msg);
}
else if (comando === 'comprarescudo' || comando === 'cescudo') {
    await cmdComprarEscudo(sender, sock, chat, msg);
}

// ===== RPG - QUIZ =====
else if (comando === 'quiz') {
    await cmdQuiz(sender, sock, chat, msg, args);
}

// ===== RPG - FAVO DE MEL =====
else if (comando === 'colherpolen' || comando === 'cp' || comando === 'favo') {
    await cmdColherPolen(sender, sock, chat, msg);
}

// ===== RPG - RANK =====
else if (comando === 'rankgold' || comando === 'rgold') {
    await cmdRankGold(sock, chat, msg);
}

// ===== RPG - JOGOS =====
else if (comando === 'jogodavelha' || comando === 'jogovelha' || comando === 'tictactoe') {
    await cmdJogoDaVelha(sock, chat, sender, msg, args);
}
else if (comando === 'jogarvelha' || comando === 'movevelha' || comando === 'move') {
    await cmdJogarVelha(sock, chat, sender, msg, args);
}
else if (comando === 'cassino' || comando === 'apostar' || comando === 'bet') {
    await cmdCassino(sock, chat, sender, msg, args);
}

// ===== RPG - FINANCEIRO =====
else if (comando === 'depositar' || comando === 'deposit') {
    await cmdDepositar(sock, chat, sender, msg, args);
}
else if (comando === 'sacar' || comando === 'withdraw') {
    await cmdSacar(sock, chat, sender, msg, args);
}
else if (comando === 'transferir' || comando === 'transfer' || comando === 'pix') {
    await cmdTransferir(sock, chat, sender, msg, args);
}

        // ===== ÁUDIO =====
        else if (comando === 'audio' || comando === 'efeito') {
          await cmdAudio(chat, sock, msg, args, sender);
        }
        else if (comando === 'videoaudio' || comando === 'va') {
          await cmdVideoAudio(chat, sock, msg, sender);
        }
        else if (comando === 'efeitos' || comando === 'listaudio') {
          await cmdEfeitos(chat, sock, msg);
        }
        
        // ===== MARCAÇÃO =====
        else if (comando === 'marcatodos' || comando === 'mt' || comando === 'todos') {
          await cmdMarcaTodos(chat, sock, sender, msg);
        }
        else if (comando === 'marcaradm' || comando === 'ma' || comando === 'admins') {
          await cmdMarcarAdm(chat, sock, sender, msg);
        }
        else if (comando === 'admins' || comando === 'listadm') {
          const metadata = await sock.groupMetadata(chat);
          const admins = metadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
          if (admins.length === 0) {
            await enviarResposta(chat, sock, '📊 Nenhum administrador encontrado!', msg);
            return;
          }
          let texto = `开启 ${CONFIG.botNome} - 👑 ADMINS 〛\n╭━━━━━━━━━━━━━━━━━━━━━⬢\n┃ 📋 ${admins.length} administradores\n╰━━━━━━━━━━━━━━━━━━━━━⬢\n\n`;
          for (const admin of admins) {
            const nome = admin.id.split('@')[0];
            texto += `@${nome}\n`;
          }
          texto += `\n╰━━━━━━━━━━━━━━━━━━━━━⬢\n『 ${CONFIG.botNome} 』`;
          const mentions = admins.map(p => p.id);
          await sock.sendMessage(chat, { text: texto, mentions }, { quoted: msg });
        }
        
// ===== WELCOME ENTRADA =====
else if (comando === 'welcome') {
    await cmdWelcome(chat, sock, sender, args, msg, enviarResposta, verificarAdmin, isDono, db, salvarDB, CONFIG);
}
else if (comando === 'setwelcome') {
    await cmdSetWelcome(chat, sock, sender, args, msg, enviarResposta, verificarAdmin, isDono, db, salvarDB, CONFIG);
}
else if (comando === 'resetwelcome') {
    await cmdResetWelcome(chat, sock, sender, msg, enviarResposta, verificarAdmin, isDono, db, salvarDB, CONFIG);
}

// ===== WELCOME SAÍDA =====
else if (comando === 'wsaida' || comando === 'welcomesaida') {
    await cmdWelcomeSaida(chat, sock, sender, args, msg, enviarResposta, verificarAdmin, isDono, db, salvarDB, CONFIG);
}
else if (comando === 'setwsaida' || comando === 'setsaida') {
    await cmdSetWelcomeSaida(chat, sock, sender, args, msg, enviarResposta, verificarAdmin, isDono, db, salvarDB, CONFIG);
}
else if (comando === 'resetwsaida' || comando === 'resetsaida') {
    await cmdResetWelcomeSaida(chat, sock, sender, msg, enviarResposta, verificarAdmin, isDono, db, salvarDB, CONFIG);
}

        else if (comando === 'antilink') {
          const pode = await podeComandoAdmin(sock, chat, sender);
          if (!pode) { await enviarResposta(chat, sock, '🚫 Apenas administradores!', msg); await reagir(sock, chat, msgId, emojiErro); return; }
          const acao = args[0]?.toLowerCase();
          if (acao === 'on') { db.antilink[chat] = true; salvarDB(); await enviarResposta(chat, sock, '🔗 Anti-Link ATIVADO!', msg); }
          else if (acao === 'off') { db.antilink[chat] = false; salvarDB(); await enviarResposta(chat, sock, '🔗 Anti-Link DESATIVADO!', msg); }
          else { await enviarResposta(chat, sock, `📌 Use: ${CONFIG.prefix}antilink on/off`, msg); }
          await reagir(sock, chat, msgId, emojiSucesso);
        }
        else {
          await enviarResposta(chat, sock, `╭━━━〔 ❌ 〕━━⬢
┃ Comando inválido.
┃
┃ 📖 ${CONFIG.prefix}menu
┃ 💬 wa.me/${CONFIG.donoOriginal}
╰━━━━━━━━━━⬢`, msg);
          await reagir(sock, chat, msgId, emojiErro);
        }
        
        await reagir(sock, chat, msgId, emojiSucesso);
      } catch (err) {
        console.error(err);
        await enviarResposta(chat, sock, '❌ Erro ao executar comando!', msg);
        await reagir(sock, chat, msgId, emojiErro);
      }
    }); // 🔥 FECHA O messages.upsert

    console.log('✅ Eventos configurados!');
}

// ================================================================
// 🔥 QUANDO O BOT CONECTAR
// ================================================================

setOnBotOnline(async (sock) => {
    console.log('🔥 CALLBACK EXECUTOU!');
    initRankings(db);
    initBlacklist(db);
    console.log('📅 Carregando agendamentos...');
    carregarAgendamentosInicial(sock);
    configurarEventos(sock);
    iniciarAvisosDoPainel(sock, 30000);
    console.log('✅ Bot pronto para usar!\n');
});

// ================================================================
// 🔥 INICIAR O BOT
// ================================================================

startBot().catch(console.error);
