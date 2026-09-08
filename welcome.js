// ==================== SISTEMA DE BOAS-VINDAS ====================
// services/welcome.js
// ============================================================

const fetch = require('node-fetch');

// ==================== CONFIGURAÇÃO ====================

const IMAGEM_PADRAO = 'https://wivkiglslhvvmutsexlx.supabase.co/storage/v1/object/public/uploads/1788729255779-an5ltq.jpg';

const MENSAGEM_ENTRADA_PADRAO = '👋 Seja bem-vindo(a) @ ao grupo {grupo}!';
const MENSAGEM_SAIDA_PADRAO = '👋 @ saiu do grupo {grupo}!';

// ==================== FUNÇÃO PARA BAIXAR IMAGEM ====================

async function baixarImagem(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return Buffer.from(await response.arrayBuffer());
    } catch (error) {
        console.error('❌ Erro ao baixar imagem:', error.message);
        return null;
    }
}

// ==================== FUNÇÃO PARA PROCESSAR MENSAGEM ====================

function processarMensagem(mensagem, nome, grupo) {
    if (!mensagem) return null;
    let texto = mensagem;
    texto = texto.replace(/{grupo}/g, grupo);
    texto = texto.replace(/@/g, `@${nome}`);
    return texto;
}

// ==================== FUNÇÃO PARA ENVIAR BOAS-VINDAS (ENTRADA) ====================

async function enviarBoasVindas(sock, chat, participant, db, CONFIG) {
    try {
        // 🔥 VERIFICA SE O WELCOME ESTÁ ATIVO
        if (!db.welcome || !db.welcome[chat]) {
            console.log(`⚠️ Welcome desativado para ${chat}`);
            return;
        }

        const participantId = typeof participant === 'string' ? participant : participant.id;
        const metadata = await sock.groupMetadata(chat);
        const grupoNome = metadata.subject || 'Grupo';
        
        // 🔥 PEGA O NOME DO USUÁRIO
        let nome = participantId.split('@')[0];
        try {
            const contact = await sock.onWhatsApp(participantId);
            if (contact && contact.length > 0 && contact[0].name) {
                nome = contact[0].name;
            }
        } catch (e) {}

        // 🔥 PEGA A FOTO DE PERFIL (OU USA A PADRÃO)
        let fotoUrl = IMAGEM_PADRAO;
        try {
            const foto = await sock.profilePictureUrl(participantId, 'image');
            if (foto) fotoUrl = foto;
        } catch (e) {
            console.log(`⚠️ Sem foto para ${nome}, usando padrão`);
        }

        // 🔥 BAIXA A IMAGEM
        const imageBuffer = await baixarImagem(fotoUrl);
        if (!imageBuffer) {
            console.log('❌ Erro ao baixar imagem, enviando só texto');
        }

        // 🔥 PEGA A MENSAGEM PERSONALIZADA
        const mensagemPersonalizada = db.welcomeMsg?.[chat] || null;
        const mensagemFinal = mensagemPersonalizada ? 
            processarMensagem(mensagemPersonalizada, nome, grupoNome) :
            processarMensagem(MENSAGEM_ENTRADA_PADRAO, nome, grupoNome);

        // 🔥 CONSTRÓI A MENSAGEM
        const texto = `${mensagemFinal}
        
『 ${CONFIG.botNome} 』`;

        // 🔥 ENVIA COM IMAGEM (SE TIVER)
        if (imageBuffer) {
            await sock.sendMessage(chat, {
                image: imageBuffer,
                caption: texto,
                mentions: [participantId]
            });
        } else {
            await sock.sendMessage(chat, {
                text: texto,
                mentions: [participantId]
            });
        }

    } catch (error) {
        console.error('❌ Erro ao enviar boas-vindas:', error.message);
    }
}

// ==================== FUNÇÃO PARA ENVIAR MENSAGEM DE SAÍDA ====================

async function enviarSaida(sock, chat, participant, db, CONFIG) {
    try {
        // 🔥 VERIFICA SE O WELCOME ESTÁ ATIVO
        if (!db.welcome || !db.welcome[chat]) {
            return;
        }

        // 🔥 VERIFICA SE A SAÍDA ESTÁ ATIVA
        if (!db.welcomeSaida || !db.welcomeSaida[chat]) {
            return;
        }

        const participantId = typeof participant === 'string' ? participant : participant.id;
        const metadata = await sock.groupMetadata(chat);
        const grupoNome = metadata.subject || 'Grupo';
        
        // 🔥 PEGA O NOME DO USUÁRIO
        let nome = participantId.split('@')[0];
        try {
            const contact = await sock.onWhatsApp(participantId);
            if (contact && contact.length > 0 && contact[0].name) {
                nome = contact[0].name;
            }
        } catch (e) {}

        // 🔥 PEGA A MENSAGEM PERSONALIZADA (SAÍDA)
        const mensagemPersonalizada = db.welcomeSaidaMsg?.[chat] || null;
        const mensagemFinal = mensagemPersonalizada ? 
            processarMensagem(mensagemPersonalizada, nome, grupoNome) :
            processarMensagem(MENSAGEM_SAIDA_PADRAO, nome, grupoNome);

        // 🔥 CONSTRÓI A MENSAGEM
        const texto = `
${mensagemFinal}

『 ${CONFIG.botNome} 』`;

        await sock.sendMessage(chat, {
            text: texto,
            mentions: [participantId]
        });

    } catch (error) {
        console.error('❌ Erro ao enviar saída:', error.message);
    }
}

// ==================== COMANDOS ====================

// ===== WELCOME (ENTRADA) =====
async function cmdWelcome(chat, sock, sender, args, msg, enviarResposta, verificarAdmin, isDono, db, salvarDB, CONFIG) {
    const isAdmin = await verificarAdmin(sock, chat, sender);
    const isDonoBot = await isDono(sender);
    
    if (!isAdmin && !isDonoBot) {
        await enviarResposta(chat, sock, '🚫 Apenas administradores!', msg);
        return;
    }

    const acao = args[0]?.toLowerCase();
    
    if (acao === 'on') {
        if (!db.welcome) db.welcome = {};
        db.welcome[chat] = true;
        salvarDB();
        await enviarResposta(chat, sock, '✅ Welcome (entrada) ATIVADO!', msg);
        return;
    }
    
    if (acao === 'off') {
        if (!db.welcome) db.welcome = {};
        db.welcome[chat] = false;
        salvarDB();
        await enviarResposta(chat, sock, '❌ Welcome (entrada) DESATIVADO!', msg);
        return;
    }
    
    const status = db.welcome?.[chat] ? '✅ ATIVO' : '❌ DESATIVADO';
    const mensagem = db.welcomeMsg?.[chat] || MENSAGEM_ENTRADA_PADRAO;
    
    await enviarResposta(chat, sock, 
        `╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ � WELCOME - ENTRADA
╰━━━━━━━━━━━━━━━━━━━━━⬢

📊 Status: ${status}
📝 Mensagem: ${mensagem}

📌 Comandos:
┃ °welcome on - Ativar
┃ °welcome off - Desativar
┃ °setwelcome <texto> - Editar mensagem
┃ °resetwelcome - Resetar mensagem

📌 Placeholders:
┃ @ - Nome da pessoa
┃ {grupo} - Nome do grupo
╰━━━━━━━━━━━━━━━━━━━━━⬢
『 ${CONFIG.botNome} 』`,
        msg
    );
}

// ===== SET WELCOME (EDITAR MENSAGEM DE ENTRADA) =====
async function cmdSetWelcome(chat, sock, sender, args, msg, enviarResposta, verificarAdmin, isDono, db, salvarDB, CONFIG) {
    const isAdmin = await verificarAdmin(sock, chat, sender);
    const isDonoBot = await isDono(sender);
    
    if (!isAdmin && !isDonoBot) {
        await enviarResposta(chat, sock, '🚫 Apenas administradores!', msg);
        return;
    }

    let mensagem = args.join(' ').trim();
    
    if (!mensagem) {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quoted) {
            mensagem = quoted.conversation || 
                       quoted.extendedTextMessage?.text || 
                       quoted.imageMessage?.caption ||
                       quoted.videoMessage?.caption ||
                       '';
        }
    }

    if (!mensagem) {
        await enviarResposta(chat, sock, 
            `📝 Use: ${CONFIG.prefix}setwelcome <mensagem>\n` +
            `📌 Placeholders: @ (nome da pessoa), {grupo} (nome do grupo)\n` +
            `📌 Exemplo: ${CONFIG.prefix}setwelcome Seja bem-vindo @ ao grupo {grupo}!`,
            msg
        );
        return;
    }

    if (!db.welcomeMsg) db.welcomeMsg = {};
    db.welcomeMsg[chat] = mensagem;
    salvarDB();
    
    await enviarResposta(chat, sock, 
        `✅ Mensagem de boas-vindas (entrada) atualizada!\n\n` +
        `📝 ${mensagem}`,
        msg
    );
}

// ===== RESET WELCOME =====
async function cmdResetWelcome(chat, sock, sender, msg, enviarResposta, verificarAdmin, isDono, db, salvarDB, CONFIG) {
    const isAdmin = await verificarAdmin(sock, chat, sender);
    const isDonoBot = await isDono(sender);
    
    if (!isAdmin && !isDonoBot) {
        await enviarResposta(chat, sock, '🚫 Apenas administradores!', msg);
        return;
    }

    if (db.welcomeMsg) {
        delete db.welcomeMsg[chat];
        salvarDB();
    }
    
    await enviarResposta(chat, sock, 
        `🔄 Mensagem de boas-vindas (entrada) resetada!\n\n` +
        `📝 Mensagem original: ${MENSAGEM_ENTRADA_PADRAO}`,
        msg
    );
}

// ===== WELCOME SAÍDA =====
async function cmdWelcomeSaida(chat, sock, sender, args, msg, enviarResposta, verificarAdmin, isDono, db, salvarDB, CONFIG) {
    const isAdmin = await verificarAdmin(sock, chat, sender);
    const isDonoBot = await isDono(sender);
    
    if (!isAdmin && !isDonoBot) {
        await enviarResposta(chat, sock, '🚫 Apenas administradores!', msg);
        return;
    }

    const acao = args[0]?.toLowerCase();
    
    if (acao === 'on') {
        if (!db.welcomeSaida) db.welcomeSaida = {};
        db.welcomeSaida[chat] = true;
        salvarDB();
        await enviarResposta(chat, sock, '✅ Welcome (saída) ATIVADO!', msg);
        return;
    }
    
    if (acao === 'off') {
        if (!db.welcomeSaida) db.welcomeSaida = {};
        db.welcomeSaida[chat] = false;
        salvarDB();
        await enviarResposta(chat, sock, '❌ Welcome (saída) DESATIVADO!', msg);
        return;
    }
    
    const status = db.welcomeSaida?.[chat] ? '✅ ATIVO' : '❌ DESATIVADO';
    const mensagem = db.welcomeSaidaMsg?.[chat] || MENSAGEM_SAIDA_PADRAO;
    
    await enviarResposta(chat, sock, 
        `╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ 👋 **WELCOME - SAÍDA**
╰━━━━━━━━━━━━━━━━━━━━━⬢

📊 Status: ${status}
📝 Mensagem: ${mensagem}

📌 Comandos:
┃ °welcome saida on - Ativar
┃ °welcome saida off - Desativar
┃ °setwsaida <texto> - Editar mensagem
┃ °resetwsaida - Resetar mensagem

📌 Placeholders:
┃ @ - Nome da pessoa
┃ {grupo} - Nome do grupo
╰━━━━━━━━━━━━━━━━━━━━━⬢
『 ${CONFIG.botNome} 』`,
        msg
    );
}

// ===== SET WELCOME SAÍDA =====
async function cmdSetWelcomeSaida(chat, sock, sender, args, msg, enviarResposta, verificarAdmin, isDono, db, salvarDB, CONFIG) {
    const isAdmin = await verificarAdmin(sock, chat, sender);
    const isDonoBot = await isDono(sender);
    
    if (!isAdmin && !isDonoBot) {
        await enviarResposta(chat, sock, '🚫 Apenas administradores!', msg);
        return;
    }

    let mensagem = args.join(' ').trim();
    
    if (!mensagem) {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quoted) {
            mensagem = quoted.conversation || 
                       quoted.extendedTextMessage?.text || 
                       quoted.imageMessage?.caption ||
                       quoted.videoMessage?.caption ||
                       '';
        }
    }

    if (!mensagem) {
        await enviarResposta(chat, sock, 
            `📝 Use: ${CONFIG.prefix}setwsaida <mensagem>\n` +
            `📌 Placeholders: @ (nome da pessoa), {grupo} (nome do grupo)\n` +
            `📌 Exemplo: ${CONFIG.prefix}setwsaida @ saiu do grupo {grupo}!`,
            msg
        );
        return;
    }

    if (!db.welcomeSaidaMsg) db.welcomeSaidaMsg = {};
    db.welcomeSaidaMsg[chat] = mensagem;
    salvarDB();
    
    await enviarResposta(chat, sock, 
        `✅ Mensagem de saída atualizada!\n\n` +
        `📝 ${mensagem}`,
        msg
    );
}

// ===== RESET WELCOME SAÍDA =====
async function cmdResetWelcomeSaida(chat, sock, sender, msg, enviarResposta, verificarAdmin, isDono, db, salvarDB, CONFIG) {
    const isAdmin = await verificarAdmin(sock, chat, sender);
    const isDonoBot = await isDono(sender);
    
    if (!isAdmin && !isDonoBot) {
        await enviarResposta(chat, sock, '🚫 Apenas administradores!', msg);
        return;
    }

    if (db.welcomeSaidaMsg) {
        delete db.welcomeSaidaMsg[chat];
        salvarDB();
    }
    
    await enviarResposta(chat, sock, 
        `🔄 Mensagem de saída resetada!\n\n` +
        `📝 Mensagem original: ${MENSAGEM_SAIDA_PADRAO}`,
        msg
    );
}

// ==================== EXPORTAR ====================

module.exports = {
    enviarBoasVindas,
    enviarSaida,
    cmdWelcome,
    cmdSetWelcome,
    cmdResetWelcome,
    cmdWelcomeSaida,
    cmdSetWelcomeSaida,
    cmdResetWelcomeSaida,
    MENSAGEM_ENTRADA_PADRAO,
    MENSAGEM_SAIDA_PADRAO
};