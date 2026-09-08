// ==================== SISTEMA DE RPG COMPLETO ====================
// services/rpgSystem.js
// ============================================================

const fs = require('fs');
const path = require('path');

// ==================== VARIÁVEL GLOBAL PARA O DB ====================
let db = null;
let CONFIG = null;
let enviarResposta = null;
let DB_PATH = null;

// ==================== FUNÇÃO PARA INICIALIZAR O MÓDULO ====================
function initModule(dbInstance, configInstance, sendResponseFunction, dbPath) {
    db = dbInstance;
    CONFIG = configInstance;
    enviarResposta = sendResponseFunction;
    DB_PATH = dbPath;
    console.log('✅ Módulo RPG inicializado com sucesso!');
}

// ==================== CONFIGURAÇÃO ====================
const CONFIG_RPG = {
    salarioMinimo: 50,
    horasTrabalho: 8,
    tempoTrabalho: 30,
    maxDiarias: 3,
    maxEmprestimos: 2,
    jogoDaVelhaTempo: 60,
    cassinoMaxAposta: 1000,
};

// ==================== EMPREGOS DISPONÍVEIS ====================
const EMPREGOS = {
    'desempregado': {
        nome: 'Desempregado',
        salario: 0,
        bonus: 0,
        emoji: '😔',
        nivelMinimo: 0,
        descricao: 'Sem emprego atualmente'
    },
    'entregador': {
        nome: 'Entregador',
        salario: 80,
        bonus: 20,
        emoji: '🛵',
        nivelMinimo: 0,
        descricao: 'Entrega de encomendas pela cidade'
    },
    'vendedor': {
        nome: 'Vendedor',
        salario: 120,
        bonus: 30,
        emoji: '🛒',
        nivelMinimo: 2,
        descricao: 'Vendas em loja de departamentos'
    },
    'motorista': {
        nome: 'Motorista',
        salario: 150,
        bonus: 40,
        emoji: '🚗',
        nivelMinimo: 3,
        descricao: 'Motorista de aplicativo'
    },
    'garcom': {
        nome: 'Garçom',
        salario: 100,
        bonus: 50,
        emoji: '🍽️',
        nivelMinimo: 1,
        descricao: 'Atendimento em restaurante'
    },
    'cozinheiro': {
        nome: 'Cozinheiro',
        salario: 180,
        bonus: 45,
        emoji: '👨‍🍳',
        nivelMinimo: 4,
        descricao: 'Prepara pratos deliciosos'
    },
    'professor': {
        nome: 'Professor',
        salario: 200,
        bonus: 60,
        emoji: '📚',
        nivelMinimo: 5,
        descricao: 'Ensina conhecimentos valiosos'
    },
    'programador': {
        nome: 'Programador',
        salario: 300,
        bonus: 80,
        emoji: '💻',
        nivelMinimo: 8,
        descricao: 'Desenvolve sistemas e códigos'
    },
    'engenheiro': {
        nome: 'Engenheiro',
        salario: 400,
        bonus: 100,
        emoji: '🏗️',
        nivelMinimo: 10,
        descricao: 'Projeta e constrói estruturas'
    },
    'medico': {
        nome: 'Médico',
        salario: 500,
        bonus: 150,
        emoji: '🏥',
        nivelMinimo: 12,
        descricao: 'Cuida da saúde das pessoas'
    },
    'empresario': {
        nome: 'Empresário',
        salario: 700,
        bonus: 200,
        emoji: '💼',
        nivelMinimo: 15,
        descricao: 'Gerencia seu próprio negócio'
    },
    'ceo': {
        nome: 'CEO',
        salario: 1000,
        bonus: 300,
        emoji: '👑',
        nivelMinimo: 20,
        descricao: 'Chefe executivo de grande empresa'
    }
};

// ==================== FAVO DE MEL - CONFIGURAÇÃO ====================
const FAVO_NIVEIS = [
    { nivel: 1, favosNecessarios: 5, premio: 200 },
    { nivel: 2, favosNecessarios: 8, premio: 400 },
    { nivel: 3, favosNecessarios: 10, premio: 600 },
    { nivel: 4, favosNecessarios: 15, premio: 700 },
    { nivel: 5, favosNecessarios: 18, premio: 800 },
    { nivel: 6, favosNecessarios: 20, premio: 1000 }
];

const PREMIOS_MINERACAO = [0, 20, 30, 50];

// ==================== FUNÇÃO DE FORMATAÇÃO (FONTE NEGRITO ITÁLICO) ====================
function fonteNegrito(texto) {
    const mapa = {
        'A': '𝐀', 'B': '𝐁', 'C': '𝐂', 'D': '𝐃', 'E': '𝐄', 'F': '𝐅', 'G': '𝐆',
        'H': '𝐇', 'I': '𝐈', 'J': '𝐉', 'K': '𝐊', 'L': '𝐋', 'M': '𝐌', 'N': '𝐍',
        'O': '𝐎', 'P': '𝐏', 'Q': '𝐐', 'R': '𝐑', 'S': '𝐒', 'T': '𝐓', 'U': '𝐔',
        'V': '𝐕', 'W': '𝐖', 'X': '𝐗', 'Y': '𝐘', 'Z': '𝐙',
        'a': '𝐚', 'b': '𝐛', 'c': '𝐜', 'd': '𝐝', 'e': '𝐞', 'f': '𝐟',
        'g': '𝐠', 'h': '𝐡', 'i': '𝐢', 'j': '𝐣', 'k': '𝐤', 'l': '𝐥',
        'm': '𝐦', 'n': '𝐧', 'o': '𝐨', 'p': '𝐩', 'q': '𝐪', 'r': '𝐫',
        's': '𝐬', 't': '𝐭', 'u': '𝐮', 'v': '𝐯', 'w': '𝐰', 'x': '𝐱',
        'y': '𝐲', 'z': '𝐳',
        '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒',
        '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗'
    };
    return String(texto).split('').map(char => mapa[char] || char).join('');
}

// ==================== INICIALIZAR RPG ====================
function initRPG(userId) {
    if (!db) {
        console.error('❌ db não está inicializado no módulo RPG');
        throw new Error('db não está inicializado');
    }
    
    if (!db.rpg) db.rpg = {};
    if (!db.rpg[userId]) {
        db.rpg[userId] = {
            dinheiro: 0,
            banco: 0,
            poupanca: 0,
            emprego: 'desempregado',
            nivelTrabalho: 1,
            xpTrabalho: 0,
            xpProxNivel: 100,
            diasTrabalhados: 0,
            ultimoTrabalho: null,
            demitido: false,
            dataAdmissao: null,
            diarias: {
                feitas: 0,
                ultimaDiaria: null
            },
            inventario: {
                itens: [],
                capacidade: 20
            },
            stats: {
                totalGanho: 0,
                totalGasto: 0,
                totalTrabalhos: 0,
                diasAtivo: 0
            },
            jogos: {
                jogoDaVelha: {
                    vitorias: 0,
                    derrotas: 0,
                    empates: 0,
                    partidas: 0
                }
            },
            mineracao: {
                ultimaMineracao: null,
                mineracoesHoje: 0
            },
            picareta: {
                ativa: false,
                usosRestantes: 0
            },
            escudo: {
                ativa: false,
                usosRestantes: 0
            },
            quiz: {
                ultimoQuiz: null,
                acertos: 0,
                erros: 0
            },
            favo: {
                nivel: 1,
                favosAtuais: 0,
                ultimaColheita: null,
                colheitasHoje: 0,
                niveisCompletados: 0,
                totalFavosColetados: 0
            }
        };
        salvarRPG();
    } else {
        // 🔥 GARANTE QUE OS CAMPOS EXISTEM PARA USUÁRIOS ANTIGOS
        const user = db.rpg[userId];
        
        if (!user.mineracao) {
            user.mineracao = { ultimaMineracao: null, mineracoesHoje: 0 };
        }
        if (!user.picareta) {
            user.picareta = { ativa: false, usosRestantes: 0 };
        }
        if (!user.escudo) {
            user.escudo = { ativa: false, usosRestantes: 0 };
        }
        if (!user.quiz) {
            user.quiz = { ultimoQuiz: null, acertos: 0, erros: 0 };
        }
        if (!user.favo) {
            user.favo = {
                nivel: 1,
                favosAtuais: 0,
                ultimaColheita: null,
                colheitasHoje: 0,
                niveisCompletados: 0,
                totalFavosColetados: 0
            };
        }
        if (!user.stats) {
            user.stats = { totalGanho: 0, totalGasto: 0, totalTrabalhos: 0, diasAtivo: 0 };
        }
        if (!user.jogos) {
            user.jogos = { jogoDaVelha: { vitorias: 0, derrotas: 0, empates: 0, partidas: 0 } };
        }
        if (!user.diarias) {
            user.diarias = { feitas: 0, ultimaDiaria: null };
        }
        
        salvarRPG();
    }
    return db.rpg[userId];
}

// ==================== SALVAR E CARREGAR ====================
function salvarRPG() {
    try {
        if (db && DB_PATH) {
            fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
        }
    } catch (e) {
        console.error('❌ Erro ao salvar RPG:', e.message);
    }
}

function carregarRPG() {
    if (!db) return {};
    if (!db.rpg) db.rpg = {};
    return db.rpg;
}

// ==================== FUNÇÕES AUXILIARES ====================
function getEmpregoNome(empregoId) {
    return EMPREGOS[empregoId]?.nome || 'Desempregado';
}

function getEmpregoSalario(empregoId) {
    return EMPREGOS[empregoId]?.salario || 0;
}

function getEmpregoBonus(empregoId) {
    return EMPREGOS[empregoId]?.bonus || 0;
}

function getEmpregoEmoji(empregoId) {
    return EMPREGOS[empregoId]?.emoji || '😔';
}

function getEmpregoDescricao(empregoId) {
    return EMPREGOS[empregoId]?.descricao || 'Sem emprego';
}

function getEmpregoNivelMinimo(empregoId) {
    return EMPREGOS[empregoId]?.nivelMinimo || 0;
}

function getNivelTrabalho(xp) {
    const niveis = [100, 200, 350, 500, 700, 1000, 1500, 2000, 3000, 5000];
    let nivel = 1;
    for (const limiar of niveis) {
        if (xp >= limiar) nivel++;
        else break;
    }
    return nivel;
}

function getXPProximoNivelTrabalho(xp) {
    const nivel = getNivelTrabalho(xp);
    const niveis = [100, 200, 350, 500, 700, 1000, 1500, 2000, 3000, 5000];
    return niveis[nivel - 1] || 10000;
}

function formatarDinheiro(valor) {
    if (valor >= 1000000) return `R$ ${(valor / 1000000).toFixed(1)}M`;
    if (valor >= 1000) return `R$ ${(valor / 1000).toFixed(1)}K`;
    return `R$ ${valor}`;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ==================== EMPREGO ====================
async function trabalhar(userId, sock, chat, msg) {
    const rpg = initRPG(userId);
    const empregoId = rpg.emprego || 'desempregado';
    
    if (empregoId === 'desempregado') {
        await enviarResposta(chat, sock, '😔 Você está desempregado! Use °vagas para ver os empregos disponíveis.', msg);
        return;
    }
    
    const hoje = new Date().toDateString();
    if (rpg.ultimoTrabalho === hoje) {
        await enviarResposta(chat, sock, '⏰ Você já trabalhou hoje! Volte amanhã para trabalhar novamente.', msg);
        return;
    }
    
    const salario = getEmpregoSalario(empregoId);
    const bonus = getEmpregoBonus(empregoId);
    const emoji = getEmpregoEmoji(empregoId);
    const nomeEmprego = getEmpregoNome(empregoId);
    
    const bonusAleatorio = getRandomInt(0, bonus);
    const ganhoTotal = salario + bonusAleatorio;
    const xpGanho = getRandomInt(5, 15) + Math.floor(ganhoTotal / 50);
    
    rpg.dinheiro += ganhoTotal;
    rpg.xpTrabalho += xpGanho;
    rpg.diasTrabalhados++;
    rpg.ultimoTrabalho = hoje;
    rpg.stats.totalGanho += ganhoTotal;
    rpg.stats.totalTrabalhos++;
    
    const novoNivel = getNivelTrabalho(rpg.xpTrabalho);
    const xpProx = getXPProximoNivelTrabalho(rpg.xpTrabalho);
    let subiuNivel = false;
    if (novoNivel > rpg.nivelTrabalho) {
        rpg.nivelTrabalho = novoNivel;
        subiuNivel = true;
    }
    
    salvarRPG();
    
    let texto = `〘 ${CONFIG.botNome} - 𝐓𝐑𝐀𝐁𝐀𝐋𝐇𝐎 〙
╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ ${emoji} ${fonteNegrito(nomeEmprego)}
┃ 👤 @${userId.split('@')[0]}
╰━━━━━━━━━━━━━━━━━━━━━⬢

𝐆𝐀𝐍𝐇𝐎𝐒:
┃ 💰 Salário: ${formatarDinheiro(salario)}
┃ 🎁 Bônus: ${formatarDinheiro(bonusAleatorio)}
┃ 💰 𝐓𝐎𝐓𝐀𝐋: ${formatarDinheiro(ganhoTotal)}
┃ ⭐ XP: +${xpGanho} XP

𝐏𝐑𝐎𝐆𝐑𝐄𝐒𝐒𝐎:
┃ 📊 Nível: ${rpg.nivelTrabalho}
┃ 📈 XP: ${rpg.xpTrabalho}/${xpProx}
┃ ${subiuNivel ? '🌟 𝐏𝐀𝐑𝐀𝐁𝐄́𝐍𝐒! Você subiu de nível!' : ''}

𝐈𝐍𝐅𝐎:
┃ 📆 Dias trabalhados: ${rpg.diasTrabalhados}
┃ 💰 Saldo: ${formatarDinheiro(rpg.dinheiro)}
┃ 📊 Total ganho: ${formatarDinheiro(rpg.stats.totalGanho)}
╰━━━━━━━━━━━━━━━━━━━━━⬢
『 ${CONFIG.botNome} 』`;

    await enviarResposta(chat, sock, texto, msg, [userId]);
}

// ==================== DIÁRIA ====================
async function diaria(userId, sock, chat, msg) {
    const rpg = initRPG(userId);
    
    const hoje = new Date().toDateString();
    if (rpg.diarias.ultimaDiaria === hoje) {
        await enviarResposta(chat, sock, '⏰ Você já pegou sua diária hoje! Volte amanhã.', msg);
        return;
    }
    
    let total = 50 + (rpg.nivelTrabalho * 10);
    const bonus = getRandomInt(0, 30);
    total += bonus;
    
    let bonusEspecial = 0;
    let mensagemBonus = '';
    if (Math.random() < 0.1) {
        bonusEspecial = getRandomInt(50, 200);
        total += bonusEspecial;
        mensagemBonus = `\n┃ 🎉 BÔNUS ESPECIAL: +${formatarDinheiro(bonusEspecial)}`;
    }
    
    rpg.dinheiro += total;
    rpg.diarias.feitas++;
    rpg.diarias.ultimaDiaria = hoje;
    rpg.stats.totalGanho += total;
    
    salvarRPG();
    
    let texto = `〘 ${CONFIG.botNome} - 𝐃𝐈Á𝐑𝐈𝐀 〙
╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ 👤 @${userId.split('@')[0]}
╰━━━━━━━━━━━━━━━━━━━━━⬢

🎁 𝐕𝐎𝐂Ê 𝐑𝐄𝐂𝐄𝐁𝐄𝐔:
┃ 💰 Base: ${formatarDinheiro(50 + (rpg.nivelTrabalho * 10))}
┃ 🎯 Bônus: ${formatarDinheiro(bonus)}
${mensagemBonus}
┃ 💰 𝐓𝐎𝐓𝐀𝐋: ${formatarDinheiro(total)}

📊 𝐄𝐒𝐓𝐀𝐓Í𝐒𝐓𝐈𝐂𝐀𝐒:
┃ 📆 Diárias coletadas: ${rpg.diarias.feitas}
┃ 💰 Saldo atual: ${formatarDinheiro(rpg.dinheiro)}
╰━━━━━━━━━━━━━━━━━━━━━⬢
『 ${CONFIG.botNome} 』`;

    await enviarResposta(chat, sock, texto, msg, [userId]);
}

// ==================== VAGAS DE EMPREGO ====================
async function vagasEmprego(userId, sock, chat, msg, args) {
    const rpg = initRPG(userId);
    const nivelAtual = rpg.nivelTrabalho || 1;
    
    if (args && args.length > 0) {
        const empregoId = args[0].toLowerCase();
        const emprego = EMPREGOS[empregoId];
        if (!emprego) {
            await enviarResposta(chat, sock, `❌ Emprego "${args[0]}" não encontrado!\n📌 Use °vagas para ver todos.`, msg);
            return;
        }
        
        const disponivel = nivelAtual >= emprego.nivelMinimo;
        const texto = `〘 ${CONFIG.botNome} - 𝐕𝐀𝐆𝐀 〙
╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ ${emprego.emoji} ${fonteNegrito(emprego.nome)}
╰━━━━━━━━━━━━━━━━━━━━━⬢

📋 𝐃𝐄𝐓𝐀𝐋𝐇𝐄𝐒:
┃ 📝 ${emprego.descricao}
┃ 💰 Salário: ${formatarDinheiro(emprego.salario)}
┃ 🎁 Bônus: ${formatarDinheiro(emprego.bonus)}
┃ 📊 Nível mínimo: ${emprego.nivelMinimo}
┃ ${disponivel ? '✅ Disponível para você' : '❌ Nível insuficiente'}

📌 Use °contratar ${empregoId} para se candidatar
╰━━━━━━━━━━━━━━━━━━━━━⬢
『 ${CONFIG.botNome} 』`;
        
        await enviarResposta(chat, sock, texto, msg);
        return;
    }
    
    let texto = `〘 ${CONFIG.botNome} - 𝐕𝐀𝐆𝐀𝐒 𝐃𝐄 𝐄𝐌𝐏𝐑𝐄𝐆𝐎 〙
╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ 👤 @${userId.split('@')[0]}
┃ 📊 Nível atual: ${nivelAtual}
╰━━━━━━━━━━━━━━━━━━━━━⬢\n`;
    
    let count = 0;
    for (const [id, emprego] of Object.entries(EMPREGOS)) {
        if (id === 'desempregado') continue;
        const disponivel = nivelAtual >= emprego.nivelMinimo;
        texto += `╭━━━━━━━━━━━━━⬢
┃ ${emprego.emoji} ${fonteNegrito(emprego.nome)}
┃ 💰 ${formatarDinheiro(emprego.salario)} | Nível ${emprego.nivelMinimo}
┃ ${disponivel ? '✅ Disponível' : '🔒 Bloqueado'}
┃ 📌 °contratar ${id}
╰━━━━━━━━━━━━━⬢\n`;
        count++;
        if (count >= 5) break;
    }
    
    texto += `╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ 📌 Use °vaga <nome> para detalhes
┃ 📌 Use °contratar <nome> para se candidatar
╰━━━━━━━━━━━━━━━━━━━━━⬢
『 ${CONFIG.botNome} 』`;
    
    await enviarResposta(chat, sock, texto, msg, [userId]);
}

// ==================== CONTRATAR / DEMITIR ====================
async function contratar(userId, sock, chat, msg, args) {
    if (!args || args.length === 0) {
        await enviarResposta(chat, sock, `📌 Use: °contratar <nome do emprego>\n📌 Exemplo: °contratar programador`, msg);
        return;
    }
    
    const rpg = initRPG(userId);
    const empregoId = args[0].toLowerCase();
    const emprego = EMPREGOS[empregoId];
    
    if (!emprego) {
        await enviarResposta(chat, sock, `❌ Emprego "${args[0]}" não encontrado!`, msg);
        return;
    }
    
    if (empregoId === 'desempregado') {
        await enviarResposta(chat, sock, '😔 Você já está desempregado!', msg);
        return;
    }
    
    const nivelAtual = rpg.nivelTrabalho || 1;
    if (nivelAtual < emprego.nivelMinimo) {
        await enviarResposta(chat, sock, `🔒 Você precisa ser nível ${emprego.nivelMinimo} para ser ${emprego.nome}!\n📊 Seu nível atual: ${nivelAtual}`, msg);
        return;
    }
    
    if (rpg.emprego !== 'desempregado') {
        const empregoAntigo = getEmpregoNome(rpg.emprego);
        rpg.emprego = empregoId;
        rpg.dataAdmissao = new Date().toISOString();
        salvarRPG();
        
        await enviarResposta(chat, sock, `🔄 Você se demitiu de ${empregoAntigo} e foi contratado como ${emprego.nome}!\n${emprego.emoji} Boa sorte no novo trabalho!`, msg);
        return;
    }
    
    rpg.emprego = empregoId;
    rpg.dataAdmissao = new Date().toISOString();
    rpg.demitido = false;
    salvarRPG();
    
    await enviarResposta(chat, sock, `🎉 𝐏𝐀𝐑𝐀𝐁𝐄́𝐍𝐒! Você foi contratado como ${emprego.nome}!\n${emprego.emoji} ${emprego.descricao}\n💰 Salário: ${formatarDinheiro(emprego.salario)} + bônus\n📌 Use °trabalhar para começar!`, msg);
}

async function demitir(userId, sock, chat, msg) {
    const rpg = initRPG(userId);
    
    if (rpg.emprego === 'desempregado') {
        await enviarResposta(chat, sock, '😔 Você já está desempregado!', msg);
        return;
    }
    
    const empregoNome = getEmpregoNome(rpg.emprego);
    const emoji = getEmpregoEmoji(rpg.emprego);
    
    rpg.emprego = 'desempregado';
    rpg.demitido = true;
    salvarRPG();
    
    await enviarResposta(chat, sock, `${emoji} Você se demitiu de ${empregoNome}.\n📌 Use °vagas para encontrar um novo emprego.`, msg);
}

// ==================== MINERAÇÃO ====================
async function cmdMinerar(userId, sock, chat, msg) {
    const rpg = initRPG(userId);
    
    if (!rpg.picareta.ativa || rpg.picareta.usosRestantes <= 0) {
        await enviarResposta(chat, sock, '⛏️ Você não tem uma picareta ativa! Compre uma com °comprarpicareta (custa 50 moedas).', msg);
        return;
    }
    
    const hoje = new Date().toDateString();
    if (rpg.mineracao.ultimaMineracao === hoje && rpg.mineracao.mineracoesHoje >= 4) {
        await enviarResposta(chat, sock, '⏰ Você já minerou 4 vezes hoje! Volte amanhã.', msg);
        return;
    }
    
    if (rpg.mineracao.ultimaMineracao !== hoje) {
        rpg.mineracao.mineracoesHoje = 0;
    }
    
    const premio = PREMIOS_MINERACAO[Math.floor(Math.random() * PREMIOS_MINERACAO.length)];
    
    rpg.picareta.usosRestantes--;
    if (rpg.picareta.usosRestantes <= 0) {
        rpg.picareta.ativa = false;
    }
    
    rpg.mineracao.mineracoesHoje++;
    rpg.mineracao.ultimaMineracao = hoje;
    
    let mensagem = '';
    if (premio === 0) {
        mensagem = '😔 Você minerou mas não encontrou nada!';
    } else {
        rpg.dinheiro += premio;
        rpg.stats.totalGanho += premio;
        mensagem = `💎 Você encontrou ${formatarDinheiro(premio)} em minério!`;
    }
    
    let quebrou = '';
    if (!rpg.picareta.ativa) {
        quebrou = '\n\n💔 Sua picareta quebrou! Compre outra com °comprarpicareta.';
    }
    
    salvarRPG();
    
    const texto = `〘 ${CONFIG.botNome} - 𝐌𝐈𝐍𝐄𝐑𝐀ÇÃ𝐎 〙
╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ ⛏️ @${userId.split('@')[0]}
╰━━━━━━━━━━━━━━━━━━━━━⬢

${mensagem}
📊 Usos restantes: ${rpg.picareta.usosRestantes}/15
📆 Minerações hoje: ${rpg.mineracao.mineracoesHoje}/4${quebrou}

💰 Saldo: ${formatarDinheiro(rpg.dinheiro)}
╰━━━━━━━━━━━━━━━━━━━━━⬢
『 ${CONFIG.botNome} 』`;

    await enviarResposta(chat, sock, texto, msg, [userId]);
}

// ==================== COMPRAR PICARETA ====================
async function cmdComprarPicareta(userId, sock, chat, msg) {
    const rpg = initRPG(userId);
    
    if (rpg.picareta.ativa) {
        await enviarResposta(chat, sock, '⛏️ Você já tem uma picareta ativa com ' + rpg.picareta.usosRestantes + ' usos restantes!', msg);
        return;
    }
    
    const PRECO = 50;
    if (rpg.dinheiro < PRECO) {
        await enviarResposta(chat, sock, `💰 Você precisa de ${formatarDinheiro(PRECO)} para comprar uma picareta! Você tem ${formatarDinheiro(rpg.dinheiro)}.`, msg);
        return;
    }
    
    rpg.dinheiro -= PRECO;
    rpg.picareta.ativa = true;
    rpg.picareta.usosRestantes = 15;
    rpg.stats.totalGasto += PRECO;
    salvarRPG();
    
    const texto = `〘 ${CONFIG.botNome} - 𝐂𝐎𝐌𝐏𝐑𝐀 〙
╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ ⛏️ @${userId.split('@')[0]}
╰━━━━━━━━━━━━━━━━━━━━━⬢

✅ Picareta comprada com sucesso!
📊 Usos: 15/15
💰 Custo: ${formatarDinheiro(PRECO)}
💳 Saldo: ${formatarDinheiro(rpg.dinheiro)}

📌 Use °minerar para começar!
╰━━━━━━━━━━━━━━━━━━━━━⬢
『 ${CONFIG.botNome} 』`;

    await enviarResposta(chat, sock, texto, msg, [userId]);
}

// ==================== COMPRAR ESCUDO ====================
async function cmdComprarEscudo(userId, sock, chat, msg) {
    const rpg = initRPG(userId);
    
    if (rpg.escudo.ativa) {
        await enviarResposta(chat, sock, '🛡️ Você já tem um escudo ativo com ' + rpg.escudo.usosRestantes + ' proteções restantes!', msg);
        return;
    }
    
    const PRECO = 80;
    if (rpg.dinheiro < PRECO) {
        await enviarResposta(chat, sock, `💰 Você precisa de ${formatarDinheiro(PRECO)} para comprar um escudo! Você tem ${formatarDinheiro(rpg.dinheiro)}.`, msg);
        return;
    }
    
    rpg.dinheiro -= PRECO;
    rpg.escudo.ativa = true;
    rpg.escudo.usosRestantes = 10;
    rpg.stats.totalGasto += PRECO;
    salvarRPG();
    
    const texto = `〘 ${CONFIG.botNome} - 𝐂𝐎𝐌𝐏𝐑𝐀 〙
╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ 🛡️ @${userId.split('@')[0]}
╰━━━━━━━━━━━━━━━━━━━━━⬢

✅ Escudo comprado com sucesso!
📊 Proteções: 10/10
💰 Custo: ${formatarDinheiro(PRECO)}
💳 Saldo: ${formatarDinheiro(rpg.dinheiro)}

🛡️ Você está protegido contra roubos!
╰━━━━━━━━━━━━━━━━━━━━━⬢
『 ${CONFIG.botNome} 』`;

    await enviarResposta(chat, sock, texto, msg, [userId]);
}

// ==================== QUIZ ====================
async function cmdQuiz(userId, sock, chat, msg, args) {
    const rpg = initRPG(userId);
    
    // 🔥 GARANTE QUE O QUIZ EXISTE
    if (!rpg.quiz) {
        rpg.quiz = { ultimoQuiz: null, acertos: 0, erros: 0 };
    }
    
    const palpite = parseInt(args[0]);
    if (isNaN(palpite) || palpite < 1 || palpite > 3) {
        await enviarResposta(chat, sock, '📌 Use: °quiz <1, 2 ou 3>\n📌 Exemplo: °quiz 2', msg);
        return;
    }
    
    const numeroSorteado = getRandomInt(1, 3);
    const premios = [20, 30, 50];
    const premio = premios[Math.floor(Math.random() * premios.length)];
    
    let mensagem = '';
    if (palpite === numeroSorteado) {
        rpg.dinheiro += premio;
        rpg.stats.totalGanho += premio;
        rpg.quiz.acertos++;
        mensagem = `🎉 𝐏𝐀𝐑𝐀𝐁𝐄́𝐍𝐒! Você acertou! O número era ${numeroSorteado}.\n💰 Ganhou ${formatarDinheiro(premio)}!`;
    } else {
        rpg.quiz.erros++;
        mensagem = `😔 Você errou! O número era ${numeroSorteado}. Tente novamente!`;
    }
    
    rpg.quiz.ultimoQuiz = new Date().toISOString();
    salvarRPG();
    
    const texto = `〘 ${CONFIG.botNome} - 𝐐𝐔𝐈𝐙 〙
╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ 🎯 @${userId.split('@')[0]}
╰━━━━━━━━━━━━━━━━━━━━━⬢

${mensagem}

📊 Acertos: ${rpg.quiz.acertos}
📊 Erros: ${rpg.quiz.erros}
💰 Saldo: ${formatarDinheiro(rpg.dinheiro)}
╰━━━━━━━━━━━━━━━━━━━━━⬢
『 ${CONFIG.botNome} 』`;

    await enviarResposta(chat, sock, texto, msg, [userId]);
}

// ==================== FAVO DE MEL ====================
async function cmdColherPolen(userId, sock, chat, msg) {
    const rpg = initRPG(userId);
    
    // 🔥 GARANTE QUE O FAVO EXISTE
    if (!rpg.favo) {
        rpg.favo = {
            nivel: 1,
            favosAtuais: 0,
            ultimaColheita: null,
            colheitasHoje: 0,
            niveisCompletados: 0,
            totalFavosColetados: 0
        };
    }
    
    const hoje = new Date().toDateString();
    if (rpg.favo.ultimaColheita === hoje && rpg.favo.colheitasHoje >= 4) {
        await enviarResposta(chat, sock, '⏰ Você já colheu pólen 4 vezes hoje! Volte amanhã.', msg);
        return;
    }
    
    if (rpg.favo.ultimaColheita !== hoje) {
        rpg.favo.colheitasHoje = 0;
    }
    
    const ganhouFavo = Math.random() < 0.5;
    let mensagem = '';
    
    if (ganhouFavo) {
        rpg.favo.favosAtuais++;
        rpg.favo.totalFavosColetados++;
        mensagem = '🍯 Você encontrou 1 favo de mel!';
    } else {
        mensagem = '😔 Você não encontrou nenhum favo desta vez.';
    }
    
    rpg.favo.colheitasHoje++;
    rpg.favo.ultimaColheita = hoje;
    
    let nivelCompleto = false;
    let premioGanho = 0;
    const nivelAtual = rpg.favo.nivel - 1;
    
    if (rpg.favo.favosAtuais >= FAVO_NIVEIS[nivelAtual].favosNecessarios) {
        nivelCompleto = true;
        premioGanho = FAVO_NIVEIS[nivelAtual].premio;
        rpg.dinheiro += premioGanho;
        rpg.stats.totalGanho += premioGanho;
        rpg.favo.niveisCompletados++;
        rpg.favo.favosAtuais = 0;
        
        if (rpg.favo.nivel >= 6) {
            const bonusFinal = 2000;
            rpg.dinheiro += bonusFinal;
            rpg.stats.totalGanho += bonusFinal;
            rpg.favo.nivel = 1;
            mensagem += `\n\n🎉 𝐏𝐀𝐑𝐀𝐁𝐄́𝐍𝐒! Você completou 𝐓𝐎𝐃𝐎𝐒 os níveis do favo!\n💰 Ganhou ${formatarDinheiro(premioGanho)} do nível + ${formatarDinheiro(bonusFinal)} de bônus final!\n🔄 Você voltou ao nível 1!`;
        } else {
            rpg.favo.nivel++;
            mensagem += `\n\n🎉 𝐍Í𝐕𝐄𝐋 ${rpg.favo.nivel - 1} 𝐂𝐎𝐌𝐏𝐋𝐄𝐓𝐎!\n💰 Você ganhou ${formatarDinheiro(premioGanho)}!\n🍯 Agora você está no nível ${rpg.favo.nivel}!`;
        }
    }
    
    salvarRPG();
    
    const nivelInfo = FAVO_NIVEIS[rpg.favo.nivel - 1];
    const progresso = Math.min(rpg.favo.favosAtuais / nivelInfo.favosNecessarios, 1);
    const barraTamanho = 20;
    const preenchido = Math.floor(progresso * barraTamanho);
    let barra = '';
    for (let i = 0; i < barraTamanho; i++) {
        barra += i < preenchido ? '🍯' : '⬜';
    }
    
    const texto = `〘 ${CONFIG.botNome} - 𝐅𝐀𝐕𝐎 𝐃𝐄 𝐌𝐄𝐋 〙
╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ 🍯 @${userId.split('@')[0]}
╰━━━━━━━━━━━━━━━━━━━━━⬢

${mensagem}

📊 𝐍Í𝐕𝐄𝐋: ${rpg.favo.nivel}/6
📊 𝐅𝐀𝐕𝐎𝐒: ${rpg.favo.favosAtuais}/${nivelInfo.favosNecessarios}
${barra}

📆 Colheitas hoje: ${rpg.favo.colheitasHoje}/4
💰 Saldo: ${formatarDinheiro(rpg.dinheiro)}
🏆 Níveis completados: ${rpg.favo.niveisCompletados}
╰━━━━━━━━━━━━━━━━━━━━━⬢
『 ${CONFIG.botNome} 』`;

    await enviarResposta(chat, sock, texto, msg, [userId]);
}

// ==================== CARTEIRA ====================
async function carteira(userId, sock, chat, msg) {
    const rpg = initRPG(userId);
    const empregoNome = getEmpregoNome(rpg.emprego);
    const emoji = getEmpregoEmoji(rpg.emprego);
    const xpProx = getXPProximoNivelTrabalho(rpg.xpTrabalho);
    const progresso = Math.floor((rpg.xpTrabalho / xpProx) * 20);
    
    let barra = '';
    for (let i = 0; i < 20; i++) {
        if (i < progresso) barra += '█';
        else barra += '░';
    }
    
    const posicao = await getPosicaoRankGold(userId);
    const statusPicareta = rpg.picareta.ativa ? `✅ ${rpg.picareta.usosRestantes}/15 usos` : '❌ Sem picareta';
    const statusEscudo = rpg.escudo.ativa ? `✅ ${rpg.escudo.usosRestantes}/10 proteções` : '❌ Sem escudo';
    const nivelInfo = FAVO_NIVEIS[rpg.favo.nivel - 1] || FAVO_NIVEIS[0];
    const progressoFavo = Math.floor((rpg.favo.favosAtuais / nivelInfo.favosNecessarios) * 100);
    
    const texto = `〘 ${CONFIG.botNome} - 𝐂𝐀𝐑𝐓𝐄𝐈𝐑𝐀 〙
╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ 👤 @${userId.split('@')[0]}
╰━━━━━━━━━━━━━━━━━━━━━⬢

💼 𝐄𝐌𝐏𝐑𝐄𝐆𝐎 𝐀𝐓𝐔𝐀𝐋:
┃ ${emoji} ${fonteNegrito(empregoNome)}
┃ ${getEmpregoDescricao(rpg.emprego)}
┃ 💰 ${formatarDinheiro(getEmpregoSalario(rpg.emprego))} + bônus

📊 𝐍Í𝐕𝐄𝐋 𝐃𝐄 𝐓𝐑𝐀𝐁𝐀𝐋𝐇𝐎:
┃ 📊 Nível: ${rpg.nivelTrabalho}
┃ ⭐ XP: ${rpg.xpTrabalho}/${xpProx}
┃ ${barra} ${Math.floor((rpg.xpTrabalho / xpProx) * 100)}%

📈 𝐄𝐒𝐓𝐀𝐓Í𝐒𝐓𝐈𝐂𝐀𝐒:
┃ 📆 Dias trabalhados: ${rpg.diasTrabalhados}
┃ 💰 Total ganho: ${formatarDinheiro(rpg.stats.totalGanho)}
┃ 📅 Contratado em: ${rpg.dataAdmissao ? new Date(rpg.dataAdmissao).toLocaleDateString('pt-BR') : 'N/A'}
┃ 🏆 ${rpg.demitido ? '⚠️ Já foi demitido' : '✅ Emprego ativo'}

💰 𝐅𝐈𝐍𝐀𝐍𝐂𝐄𝐈𝐑𝐎:
┃ 💰 Dinheiro: ${formatarDinheiro(rpg.dinheiro)}
┃ 🏦 Banco: ${formatarDinheiro(rpg.banco)}
┃ 📈 Poupança: ${formatarDinheiro(rpg.poupanca)}

⛏️ 𝐌𝐈𝐍𝐄𝐑𝐀ÇÃ𝐎:
┃ 🪓 Picareta: ${statusPicareta}
┃ ⛏️ Minerações hoje: ${rpg.mineracao.mineracoesHoje || 0}/4

🛡️ 𝐄𝐒𝐂𝐔𝐃𝐎:
┃ 🛡️ Escudo: ${statusEscudo}

🍯 𝐅𝐀𝐕𝐎 𝐃𝐄 𝐌𝐄𝐋:
┃ 📊 Nível: ${rpg.favo.nivel}/6
┃ 🍯 Favos: ${rpg.favo.favosAtuais}/${nivelInfo.favosNecessarios} (${progressoFavo}%)
┃ 🏆 Níveis completados: ${rpg.favo.niveisCompletados || 0}

🏆 𝐑𝐀𝐍𝐊 𝐆𝐎𝐋𝐃:
┃ 📊 Posição: ${posicao !== null ? `#${posicao}` : 'N/A'}

╰━━━━━━━━━━━━━━━━━━━━━⬢
『 ${CONFIG.botNome} 』`;

    await enviarResposta(chat, sock, texto, msg, [userId]);
}

// ==================== RANK GOLD ====================
async function getPosicaoRankGold(userId) {
    try {
        if (!db || !db.rpg) return null;
        const ranking = Object.entries(db.rpg)
            .sort((a, b) => (b[1].dinheiro || 0) - (a[1].dinheiro || 0));
        const posicao = ranking.findIndex(([id]) => id === userId);
        return posicao !== -1 ? posicao + 1 : null;
    } catch (e) {
        return null;
    }
}

async function cmdRankGold(sock, chat, msg) {
    if (!db || !db.rpg) {
        await enviarResposta(chat, sock, '📊 Nenhum dado de RPG ainda!', msg);
        return;
    }
    
    const ranking = Object.entries(db.rpg)
        .map(([id, data]) => ({
            id,
            dinheiro: data.dinheiro || 0,
            picareta: data.picareta?.ativa || false,
            escudo: data.escudo?.ativa || false,
            favoNivel: data.favo?.nivel || 1,
            emprego: data.emprego || 'desempregado',
            nivelTrabalho: data.nivelTrabalho || 1
        }))
        .filter(user => user.dinheiro > 0 || user.picareta || user.escudo || user.favoNivel > 1)
        .sort((a, b) => b.dinheiro - a.dinheiro)
        .slice(0, 15);
    
    if (ranking.length === 0) {
        await enviarResposta(chat, sock, '📊 Nenhum jogador com moedas ainda!', msg);
        return;
    }
    
    let texto = `〘 ${CONFIG.botNome} - 𝐑𝐀𝐍𝐊 𝐆𝐎𝐋𝐃 〙
╭━━━━━━━━━━━━━━━━━━━━━⬢\n`;
    
    ranking.forEach((user, index) => {
        const medalha = index === 0 ? '👑' : index === 1 ? '🥇' : index === 2 ? '🥈' : index === 3 ? '🥉' : `${index+1}°`;
        const emoji = user.picareta ? '⛏️' : user.escudo ? '🛡️' : '💰';
        const nome = user.id.split('@')[0];
        texto += `┃ ${medalha} ${emoji} @${nome}\n`;
        texto += `┃   💰 ${formatarDinheiro(user.dinheiro)}\n`;
        texto += `┃   🪓 ${user.picareta ? '✅' : '❌'} | 🛡️ ${user.escudo ? '✅' : '❌'}\n`;
        texto += `┃   🍯 Nível ${user.favoNivel} | 📊 Nível ${user.nivelTrabalho}\n\n`;
    });
    
    texto += `╰━━━━━━━━━━━━━━━━━━━━━⬢
『 ${CONFIG.botNome} 』`;
    
    const mentions = ranking.map(u => u.id);
    await sock.sendMessage(chat, { text: texto, mentions }, { quoted: msg });
}

// ==================== RANKING DE TRABALHO ====================
async function rankTrabalho(sock, chat, msg) {
    if (!db || !db.rpg) {
        await enviarResposta(chat, sock, '📊 Nenhum dado de trabalho ainda!', msg);
        return;
    }
    
    const ranking = Object.entries(db.rpg)
        .map(([id, data]) => ({
            id,
            nivel: data.nivelTrabalho || 1,
            xp: data.xpTrabalho || 0,
            dinheiro: data.dinheiro || 0,
            dias: data.diasTrabalhados || 0,
            emprego: data.emprego || 'desempregado'
        }))
        .sort((a, b) => b.xp - a.xp)
        .slice(0, 15);
    
    if (ranking.length === 0) {
        await enviarResposta(chat, sock, '📊 Nenhum dado de trabalho ainda!', msg);
        return;
    }
    
    let texto = `〘 ${CONFIG.botNome} - 𝐑𝐀𝐍𝐊𝐈𝐍𝐆 𝐃𝐄 𝐓𝐑𝐀𝐁𝐀𝐋𝐇𝐎 〙
╭━━━━━━━━━━━━━━━━━━━━━⬢\n`;
    
    ranking.forEach((user, index) => {
        const medalha = index === 0 ? '👑' : index === 1 ? '🥇' : index === 2 ? '🥈' : index === 3 ? '🥉' : `${index+1}°`;
        const emoji = getEmpregoEmoji(user.emprego);
        const nome = user.id.split('@')[0];
        texto += `┃ ${medalha} ${emoji} @${nome}\n`;
        texto += `┃   📊 Nível ${user.nivel} | 💰 ${formatarDinheiro(user.dinheiro)}\n`;
        texto += `┃   📆 ${user.dias} dias trabalhados\n\n`;
    });
    
    texto += `╰━━━━━━━━━━━━━━━━━━━━━⬢
『 ${CONFIG.botNome} 』`;
    
    const mentions = ranking.map(u => u.id);
    await sock.sendMessage(chat, { text: texto, mentions }, { quoted: msg });
}

// ==================== JOGO DA VELHA COMPLETO ====================

let jogosAtivos = {};

function initJogoDaVelha(jogador1, jogador2) {
    const id = `${jogador1}_${jogador2}_${Date.now()}`;
    jogosAtivos[id] = {
        id,
        jogador1,
        jogador2,
        vez: jogador1,
        tabuleiro: Array(9).fill(null),
        estado: 'aguardando',
        vencedor: null,
        ultimoMovimento: Date.now(),
        iniciadoEm: Date.now()
    };
    return id;
}

function fazerMovimento(jogoId, jogador, posicao) {
    const jogo = jogosAtivos[jogoId];
    if (!jogo) return { erro: 'Jogo não encontrado' };
    if (jogo.estado === 'finalizado') return { erro: 'Jogo já finalizado' };
    if (jogo.vez !== jogador) return { erro: 'Não é sua vez' };
    if (jogo.tabuleiro[posicao] !== null) return { erro: 'Posição ocupada' };
    if (posicao < 0 || posicao > 8) return { erro: 'Posição inválida' };
    
    const simbolo = jogador === jogo.jogador1 ? '❌' : '⭕';
    jogo.tabuleiro[posicao] = simbolo;
    jogo.ultimoMovimento = Date.now();
    
    const vitoria = verificarVitoria(jogo.tabuleiro);
    if (vitoria) {
        jogo.estado = 'finalizado';
        jogo.vencedor = jogador;
        return { vitoria: true, vencedor: jogador, tabuleiro: jogo.tabuleiro };
    }
    
    if (jogo.tabuleiro.every(cell => cell !== null)) {
        jogo.estado = 'finalizado';
        jogo.vencedor = 'empate';
        return { empate: true, tabuleiro: jogo.tabuleiro };
    }
    
    jogo.vez = jogo.vez === jogo.jogador1 ? jogo.jogador2 : jogo.jogador1;
    return { tabuleiro: jogo.tabuleiro, vez: jogo.vez };
}

function verificarVitoria(tabuleiro) {
    const linhas = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    
    for (const linha of linhas) {
        if (tabuleiro[linha[0]] && 
            tabuleiro[linha[0]] === tabuleiro[linha[1]] && 
            tabuleiro[linha[0]] === tabuleiro[linha[2]]) {
            return true;
        }
    }
    return false;
}

function renderizarTabuleiro(tabuleiro) {
    let texto = '';
    for (let i = 0; i < 9; i += 3) {
        const c1 = tabuleiro[i] !== null ? ` ${tabuleiro[i]} ` : ` ${i+1} `;
        const c2 = tabuleiro[i+1] !== null ? ` ${tabuleiro[i+1]} ` : ` ${i+2} `;
        const c3 = tabuleiro[i+2] !== null ? ` ${tabuleiro[i+2]} ` : ` ${i+3} `;
        texto += `┃ ${c1} │ ${c2} │ ${c3}\n`;
        if (i < 6) texto += '┃ ───┼───┼───\n';
    }
    return texto;
}

function verificarJogosExpirados() {
    const agora = Date.now();
    const TEMPO_EXPIRACAO = 5 * 60 * 1000;
    
    for (const [id, jogo] of Object.entries(jogosAtivos)) {
        if (jogo.estado === 'finalizado') continue;
        const tempoInativo = agora - jogo.ultimoMovimento;
        if (tempoInativo > TEMPO_EXPIRACAO) {
            jogo.estado = 'finalizado';
            jogo.vencedor = 'expirado';
            console.log(`⏰ Jogo ${id} expirou por inatividade`);
        }
    }
}

setInterval(verificarJogosExpirados, 30000);

function extrairNumero(sender) {
    if (!sender) return 'unknown';
    const numeros = sender.match(/\d+/g);
    if (numeros) {
        return numeros[numeros.length - 1];
    }
    return sender.split('@')[0];
}

// ==================== COMANDO: INICIAR JOGO ====================
async function cmdJogoDaVelha(sock, chat, sender, msg, args) {
    const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    let oponente = mentionedJid[0];
    
    if (!oponente && args.length > 0) {
        const arg = args[0].replace('@', '');
        try {
            const metadata = await sock.groupMetadata(chat);
            const participantes = metadata.participants.map(p => p.id);
            const encontrado = participantes.find(p => p.startsWith(arg) || p.includes(arg));
            if (encontrado) oponente = encontrado;
        } catch (e) {}
    }
    
    if (!oponente) {
        await enviarResposta(chat, sock, 
            `📌 Use: ${CONFIG.prefix}jogodavelha @usuario\n` +
            `📌 Exemplo: ${CONFIG.prefix}jogodavelha @joao`, 
            msg
        );
        return;
    }
    
    if (oponente === sender) {
        await enviarResposta(chat, sock, '❌ Você não pode jogar contra si mesmo!', msg);
        return;
    }
    
    try {
        const metadata = await sock.groupMetadata(chat);
        const participantes = metadata.participants.map(p => p.id);
        if (!participantes.includes(oponente)) {
            await enviarResposta(chat, sock, '❌ Esta pessoa não está no grupo!', msg);
            return;
        }
    } catch (e) {}
    
    verificarJogosExpirados();
    
    for (const [id, jogo] of Object.entries(jogosAtivos)) {
        if ((jogo.jogador1 === sender && jogo.jogador2 === oponente) ||
            (jogo.jogador1 === oponente && jogo.jogador2 === sender)) {
            if (jogo.estado !== 'finalizado') {
                await enviarResposta(chat, sock, 
                    '⚠️ Já existe um jogo ativo entre vocês!\n' +
                    `Use ${CONFIG.prefix}jogarvelha <1-9> para jogar.`, 
                    msg
                );
                return;
            }
        }
    }
    
    const jogoId = initJogoDaVelha(sender, oponente);
    const jogo = jogosAtivos[jogoId];
    
    const nome1 = extrairNumero(sender);
    const nome2 = extrairNumero(oponente);
    
    const texto = `🎮 𝐉𝐎𝐆𝐎 𝐃𝐀 𝐕𝐄𝐋𝐇𝐀 𝐈𝐍𝐈𝐂𝐈𝐀𝐃𝐎!
╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ ❌ @${nome1} VS @${nome2} ⭕
╰━━━━━━━━━━━━━━━━━━━━━⬢

𝐓𝐀𝐁𝐔𝐋𝐄𝐈𝐑𝐎:
${renderizarTabuleiro(jogo.tabuleiro)}

🔴 𝐕𝐞𝐳 𝐝𝐞: @${nome1} (❌)
📌 Use ${CONFIG.prefix}jogarvelha <1-9> para fazer sua jogada
⏰ O jogo expira em 5 minutos sem movimentos`;

    await sock.sendMessage(chat, { 
        text: texto, 
        mentions: [sender, oponente] 
    }, { quoted: msg });
}

// ==================== COMANDO: FAZER JOGADA ====================
async function cmdJogarVelha(sock, chat, sender, msg, args) {
    if (!args || args.length === 0) {
        await enviarResposta(chat, sock, 
            `📌 Use: ${CONFIG.prefix}jogarvelha <1-9>\n` +
            `📌 Exemplo: ${CONFIG.prefix}jogarvelha 5`, 
            msg
        );
        return;
    }
    
    const posicao = parseInt(args[0]) - 1;
    if (isNaN(posicao) || posicao < 0 || posicao > 8) {
        await enviarResposta(chat, sock, '📌 Posição inválida! Use números de 1 a 9.', msg);
        return;
    }
    
    verificarJogosExpirados();
    
    let jogoId = null;
    let jogo = null;
    for (const [id, j] of Object.entries(jogosAtivos)) {
        if ((j.jogador1 === sender || j.jogador2 === sender) && j.estado !== 'finalizado') {
            jogoId = id;
            jogo = j;
            break;
        }
    }
    
    if (!jogo) {
        await enviarResposta(chat, sock, 
            '⚠️ Você não tem nenhum jogo ativo!\n' +
            `Use ${CONFIG.prefix}jogodavelha @usuario para iniciar.`, 
            msg
        );
        return;
    }
    
    if (jogo.vencedor === 'expirado') {
        await enviarResposta(chat, sock, 
            '⏰ O jogo expirou por inatividade!\n' +
            `Inicie um novo com ${CONFIG.prefix}jogodavelha @usuario.`, 
            msg
        );
        return;
    }
    
    if (jogo.vez !== sender) {
        const vezNome = extrairNumero(jogo.vez);
        await enviarResposta(chat, sock, 
            `⏰ Não é sua vez! Aguarde @${vezNome} jogar.`, 
            msg, 
            [jogo.vez]
        );
        return;
    }
    
    const resultado = fazerMovimento(jogoId, sender, posicao);
    
    if (resultado.erro) {
        await enviarResposta(chat, sock, `❌ ${resultado.erro}`, msg);
        return;
    }
    
    const tabuleiroTexto = renderizarTabuleiro(resultado.tabuleiro);
    const jogoAtual = jogosAtivos[jogoId];
    
    // ==================== VITÓRIA ====================
    if (resultado.vitoria) {
        const vencedor = resultado.vencedor;
        const perdedor = vencedor === jogoAtual.jogador1 ? jogoAtual.jogador2 : jogoAtual.jogador1;
        
        const rpgVencedor = initRPG(vencedor);
        const rpgPerdedor = initRPG(perdedor);
        rpgVencedor.jogos.jogoDaVelha.vitorias++;
        rpgVencedor.jogos.jogoDaVelha.partidas++;
        rpgPerdedor.jogos.jogoDaVelha.derrotas++;
        rpgPerdedor.jogos.jogoDaVelha.partidas++;
        
        const bonus = getRandomInt(10, 50);
        rpgVencedor.dinheiro += bonus;
        salvarRPG();
        
        const vencedorNome = extrairNumero(vencedor);
        const perdedorNome = extrairNumero(perdedor);
        
        const texto = `🏆 @${vencedorNome} 𝐕𝐄𝐍𝐂𝐄𝐔 𝐎 𝐉𝐎𝐆𝐎 𝐃𝐀 𝐕𝐄𝐋𝐇𝐀!

╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ ❌ @${vencedorNome} ⭕ @${perdedorNome}
╰━━━━━━━━━━━━━━━━━━━━━⬢

𝐓𝐀𝐁𝐔𝐋𝐄𝐈𝐑𝐎 𝐅𝐈𝐍𝐀𝐋:
${tabuleiroTexto}

💰 ${formatarDinheiro(bonus)} de bônus para o vencedor!

╰━━━━━━━━━━━━━━━━━━━━━⬢
『 ${CONFIG.botNome} 』`;

        await sock.sendMessage(chat, {
            text: texto,
            mentions: [vencedor, perdedor]
        }, { quoted: msg });
        
        setTimeout(() => {
            delete jogosAtivos[jogoId];
        }, 60000);
        
        return;
    }
    
    // ==================== EMPATE ====================
    if (resultado.empate) {
        const rpg1 = initRPG(jogoAtual.jogador1);
        const rpg2 = initRPG(jogoAtual.jogador2);
        rpg1.jogos.jogoDaVelha.empates++;
        rpg1.jogos.jogoDaVelha.partidas++;
        rpg2.jogos.jogoDaVelha.empates++;
        rpg2.jogos.jogoDaVelha.partidas++;
        salvarRPG();
        
        const nome1 = extrairNumero(jogoAtual.jogador1);
        const nome2 = extrairNumero(jogoAtual.jogador2);
        
        const texto = `🤝 𝐄𝐌𝐏𝐀𝐓𝐄!

╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ ❌ @${nome1} ⭕ @${nome2}
╰━━━━━━━━━━━━━━━━━━━━━⬢

𝐓𝐀𝐁𝐔𝐋𝐄𝐈𝐑𝐎 𝐅𝐈𝐍𝐀𝐋:
${tabuleiroTexto}

╰━━━━━━━━━━━━━━━━━━━━━⬢
『 ${CONFIG.botNome} 』`;

        await sock.sendMessage(chat, {
            text: texto,
            mentions: [jogoAtual.jogador1, jogoAtual.jogador2]
        }, { quoted: msg });
        
        setTimeout(() => {
            delete jogosAtivos[jogoId];
        }, 60000);
        return;
    }
    
    // ==================== PRÓXIMA JOGADA ====================
    const proximo = jogoAtual.vez;
    const simbolo = proximo === jogoAtual.jogador1 ? '❌' : '⭕';
    const proximoNome = extrairNumero(proximo);
    
    const texto = `𝐓𝐀𝐁𝐔𝐋𝐄𝐈𝐑𝐎 𝐀𝐓𝐔𝐀𝐋:
${tabuleiroTexto}

🔴 𝐕𝐞𝐳 𝐝𝐞: @${proximoNome} (${simbolo})
📌 Use ${CONFIG.prefix}jogarvelha <1-9>`;

    await sock.sendMessage(chat, {
        text: texto,
        mentions: [proximo]
    }, { quoted: msg });
}
// ==================== CASSINO ====================
async function cmdCassino(sock, chat, sender, msg, args) {
    if (!args || args.length < 2) {
        await enviarResposta(chat, sock, `📌 Use: °cassino <numero> <aposta>\n📌 Exemplo: °cassino 7 100`, msg);
        return;
    }
    
    const numero = parseInt(args[0]);
    const aposta = parseInt(args[1]);
    
    if (isNaN(numero) || numero < 0 || numero > 9) {
        await enviarResposta(chat, sock, '📌 Número inválido! Escolha um número de 0 a 9.', msg);
        return;
    }
    
    if (isNaN(aposta) || aposta <= 0) {
        await enviarResposta(chat, sock, '📌 Aposta inválida!', msg);
        return;
    }
    
    const rpg = initRPG(sender);
    
    if (aposta > rpg.dinheiro) {
        await enviarResposta(chat, sock, `💰 Você só tem ${formatarDinheiro(rpg.dinheiro)}!`, msg);
        return;
    }
    
    if (aposta > CONFIG_RPG.cassinoMaxAposta) {
        await enviarResposta(chat, sock, `📌 Aposta máxima: ${formatarDinheiro(CONFIG_RPG.cassinoMaxAposta)}`, msg);
        return;
    }
    
    const sorteado = getRandomInt(0, 9);
    const acertou = numero === sorteado;
    
    let ganho = 0;
    let mensagem = '';
    
    if (acertou) {
        const multiplicador = 8;
        ganho = aposta * multiplicador;
        rpg.dinheiro += ganho;
        mensagem = `🎉 𝐏𝐀𝐑𝐀𝐁𝐄́𝐍𝐒! Você acertou o número ${sorteado}!\n💰 Ganhou ${formatarDinheiro(ganho)}!`;
    } else {
        rpg.dinheiro -= aposta;
        mensagem = `😔 Você apostou ${formatarDinheiro(aposta)} no número ${numero}\n🎲 O número sorteado foi ${sorteado}\n💸 Você perdeu ${formatarDinheiro(aposta)}!`;
    }
    
    salvarRPG();
    
    const texto = `🎰 𝐂𝐀𝐒𝐒𝐈𝐍𝐎
╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ 👤 @${sender.split('@')[0]}
┃ 🎯 Aposta: ${formatarDinheiro(aposta)}
┃ 🎲 Número: ${numero}
┃ 🎰 Sorteado: ${sorteado}
╰━━━━━━━━━━━━━━━━━━━━━⬢

${mensagem}
💰 Saldo atual: ${formatarDinheiro(rpg.dinheiro)}`;

    await enviarResposta(chat, sock, texto, msg, [sender]);
}

// ==================== DEPOSITAR / SACAR / TRANSFERIR ====================
async function cmdDepositar(sock, chat, sender, msg, args) {
    if (!args || args.length === 0) {
        await enviarResposta(chat, sock, `📌 Use: °depositar <valor>`, msg);
        return;
    }
    
    const valor = parseInt(args[0]);
    if (isNaN(valor) || valor <= 0) {
        await enviarResposta(chat, sock, '📌 Valor inválido!', msg);
        return;
    }
    
    const rpg = initRPG(sender);
    
    if (valor > rpg.dinheiro) {
        await enviarResposta(chat, sock, `💰 Você só tem ${formatarDinheiro(rpg.dinheiro)}!`, msg);
        return;
    }
    
    rpg.dinheiro -= valor;
    rpg.banco += valor;
    salvarRPG();
    
    await enviarResposta(chat, sock, `💰 Depósito de ${formatarDinheiro(valor)} realizado!\n🏦 Saldo no banco: ${formatarDinheiro(rpg.banco)}\n💳 Saldo em mãos: ${formatarDinheiro(rpg.dinheiro)}`, msg);
}

async function cmdSacar(sock, chat, sender, msg, args) {
    if (!args || args.length === 0) {
        await enviarResposta(chat, sock, `📌 Use: °sacar <valor>`, msg);
        return;
    }
    
    const valor = parseInt(args[0]);
    if (isNaN(valor) || valor <= 0) {
        await enviarResposta(chat, sock, '📌 Valor inválido!', msg);
        return;
    }
    
    const rpg = initRPG(sender);
    
    if (valor > rpg.banco) {
        await enviarResposta(chat, sock, `🏦 Você só tem ${formatarDinheiro(rpg.banco)} no banco!`, msg);
        return;
    }
    
    rpg.banco -= valor;
    rpg.dinheiro += valor;
    salvarRPG();
    
    await enviarResposta(chat, sock, `💰 Saque de ${formatarDinheiro(valor)} realizado!\n🏦 Saldo no banco: ${formatarDinheiro(rpg.banco)}\n💳 Saldo em mãos: ${formatarDinheiro(rpg.dinheiro)}`, msg);
}

async function cmdTransferir(sock, chat, sender, msg, args) {
    if (!args || args.length < 2) {
        await enviarResposta(chat, sock, `📌 Use: °transferir @usuario <valor>`, msg);
        return;
    }
    
    const alvo = args[0].startsWith('@') ? args[0].replace('@', '') + '@s.whatsapp.net' : null;
    if (!alvo) {
        await enviarResposta(chat, sock, '📌 Marque o usuário!', msg);
        return;
    }
    
    const valor = parseInt(args[1]);
    if (isNaN(valor) || valor <= 0) {
        await enviarResposta(chat, sock, '📌 Valor inválido!', msg);
        return;
    }
    
    if (alvo === sender) {
        await enviarResposta(chat, sock, '❌ Não pode transferir para si mesmo!', msg);
        return;
    }
    
    const rpgSender = initRPG(sender);
    const rpgAlvo = initRPG(alvo);
    
    if (valor > rpgSender.dinheiro) {
        await enviarResposta(chat, sock, `💰 Você só tem ${formatarDinheiro(rpgSender.dinheiro)}!`, msg);
        return;
    }
    
    rpgSender.dinheiro -= valor;
    rpgAlvo.dinheiro += valor;
    salvarRPG();
    
    await enviarResposta(chat, sock, `💰 Transferência de ${formatarDinheiro(valor)} para @${alvo.split('@')[0]} realizada!\n💳 Seu saldo: ${formatarDinheiro(rpgSender.dinheiro)}`, msg, [sender, alvo]);
}

// ==================== EXPORTAR MÓDULO ====================
module.exports = {
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
    cmdRankGold,
    formatarDinheiro,
    getEmpregoNome,
    getEmpregoSalario,
    getEmpregoEmoji,
    EMPREGOS,
    initRPG,
    salvarRPG,
    jogosAtivos,
    fonteNegrito
};