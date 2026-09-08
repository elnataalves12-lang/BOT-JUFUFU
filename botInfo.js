// ==================== BOT INFO ====================
// services/botInfo.js
// ============================================================

const fs = require('fs');
const path = require('path');
const os = require('os');

// ==================== CALCULAR TAMANHO DA PASTA ====================

function getFolderSize(folderPath) {
    let totalSize = 0;
    try {
        const files = fs.readdirSync(folderPath);
        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                totalSize += getFolderSize(filePath);
            } else {
                totalSize += stats.size;
            }
        }
    } catch (e) {}
    return totalSize;
}

// ==================== FORMATAR TAMANHO ====================

function formatarTamanho(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ==================== CALCULAR TEMPO DE ATIVIDADE ====================

function calcularTempoAtivo(inicio) {
    const agora = Date.now();
    const diffMs = agora - inicio;
    
    const segundos = Math.floor(diffMs / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    
    if (dias > 0) {
        return `${dias}d ${horas % 24}h ${minutos % 60}m`;
    } else if (horas > 0) {
        return `${horas}h ${minutos % 60}m ${segundos % 60}s`;
    } else if (minutos > 0) {
        return `${minutos}m ${segundos % 60}s`;
    } else {
        return `${segundos}s`;
    }
}

// ==================== FORMATAR DATA ====================

function formatarData(data) {
    return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ==================== FUNÇÃO PRINCIPAL ====================

async function cmdBotInfo(sock, chat, msg, CONFIG, db) {
    try {
        // 🔥 INFORMAÇÕES BÁSICAS
        const botNome = CONFIG.botNome || 'JUFUFU Bot';
        const nomeOriginal = '𝙹𝚄𝙵𝚄𝙵𝚄-ᵇᵒᵗ-𝑧𝑧𝑧';
        const versao = CONFIG.versao || '3.0';
        const prefixo = CONFIG.prefix || '°';
        const donos = CONFIG.donos || [];
        const primeiroDono = donos.length > 0 ? donos[0] : 'N/A';
        
        // 🔥 HOSTNAME (SISTEMA)
        const hostname = os.hostname() || 'Desconhecido';
        
        // 🔥 TEMPO DE ATIVIDADE
        const tempoAtivo = calcularTempoAtivo(global.inicioBot || Date.now());
        
        // 🔥 GRUPOS QUE O BOT ESTÁ
        let totalGrupos = 0;
        try {
            const groups = await sock.groupFetchAllParticipating();
            totalGrupos = Object.keys(groups).length;
        } catch (e) {
            totalGrupos = 0;
        }
        
        // 🔥 TAMANHO DO BOT NO DISCO
        const botPath = path.join(__dirname, '..');
        const tamanhoBot = getFolderSize(botPath);
        const tamanhoFormatado = formatarTamanho(tamanhoBot);
        
        // 🔥 MEMÓRIA USADA
        const memoriaUsada = process.memoryUsage();
        const memoriaHeap = formatarTamanho(memoriaUsada.heapUsed);
        const memoriaRSS = formatarTamanho(memoriaUsada.rss);
        
        // 🔥 SISTEMA OPERACIONAL
        const sistema = os.type() + ' ' + os.release();
        const arquitetura = os.arch();
        const cores = os.cpus().length;
        const memoriaTotal = formatarTamanho(os.totalmem());
        const memoriaLivre = formatarTamanho(os.freemem());
        
        // 🔥 DATA DE INÍCIO DO BOT
        const dataInicio = formatarData(new Date(global.inicioBot || Date.now()));
        
        // 🔥 DATA ATUAL
        const dataAtual = formatarData(new Date());
        
        // 🔥 NOME DO CRIADOR
        const nomeCriador = 'Alves';
        
        // 🔥 LINKS
        const canalLink = 'https://whatsapp.com/channel/0029VbDHw0fAO7RBFTJ3rn1e';
        const appLink = 'https://teammita.lovable.app/';

        // ============================================================
        // CONSTRÓI A MENSAGEM
        // ============================================================
        
        let texto = `╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ 🤖 **INFORMAÇÕES DO BOT**
╰━━━━━━━━━━━━━━━━━━━━━⬢

╭━━━━━━━━━━━━━⬢
┃ 📛 **NOME:**
┃ ${botNome}
┃ 📛 **NOME ORIGINAL:**
┃ ${nomeOriginal}
┃ 📌 **VERSÃO:** ${versao}
┃ 🔖 **PREFIXO:** ${prefixo}
┃ 👑 **CRIADOR:** ${nomeCriador}
╰━━━━━━━━━━━━━⬢

╭━━━━━━━━━━━━━⬢
┃ 👑 **DONOS DO BOT:**
${donos.length > 0 ? donos.map(d => `┃ 👤 ${d}`).join('\n') : '┃ 📌 Nenhum dono configurado'}
╰━━━━━━━━━━━━━⬢

╭━━━━━━━━━━━━━⬢
┃ 👤 **DONO ATUAL:**
┃ 📱 ${primeiroDono}
┃ 💻 **SISTEMA:** ${hostname}
┃ 📅 **INICIADO EM:** ${dataInicio}
┃ ⏱️ **ATIVO HÁ:** ${tempoAtivo}
┃ 💾 **TAMANHO:** ${tamanhoFormatado}
╰━━━━━━━━━━━━━⬢

╭━━━━━━━━━━━━━⬢
┃ 📊 **ESTATÍSTICAS:**
┃ 📱 **GRUPOS:** ${totalGrupos}
┃ 💻 **SISTEMA:** ${sistema}
┃ 🖥️ **ARQUITETURA:** ${arquitetura}
┃ 🧠 **CORES:** ${cores}
┃ 💾 **MEMÓRIA TOTAL:** ${memoriaTotal}
┃ 📦 **MEMÓRIA LIVRE:** ${memoriaLivre}
┃ 🧪 **HEAP USADO:** ${memoriaHeap}
┃ 📊 **RSS:** ${memoriaRSS}
╰━━━━━━━━━━━━━⬢

╭━━━━━━━━━━━━━⬢
┃ 🔗 **LINKS:**
┃ 📢 **CANAL DO BOT:**
┃ ${canalLink}
┃
┃ 📱 **APLICATIVO:**
┃ ${appLink}
┃
┃ ⚠️ *Siga o canal para ver as atualizações!*
╰━━━━━━━━━━━━━⬢

╭━━━━━━━━━━━━━⬢
┃ 📅 **DATA ATUAL:** ${dataAtual}
┃ 🤖 ${botNome}
┃ 👑 ${nomeCriador}
╰━━━━━━━━━━━━━⬢
『 ${botNome} 』`;

        // 🔥 MENCIONA TODOS OS DONOS
        const mentions = [];
        if (Array.isArray(CONFIG.donos)) {
            for (const dono of CONFIG.donos) {
                mentions.push(dono + '@s.whatsapp.net');
            }
        }

        // 🔥 ENVIA A MENSAGEM
        await sock.sendMessage(chat, {
            text: texto,
            mentions: mentions
        }, { quoted: msg });

    } catch (error) {
        console.error('❌ Erro no botinfo:', error);
        await sock.sendMessage(chat, {
            text: `❌ Erro ao buscar informações: ${error.message}`
        }, { quoted: msg });
    }
}

// ==================== EXPORTAR ====================

module.exports = {
    cmdBotInfo
};