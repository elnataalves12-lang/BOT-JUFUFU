// ==================== SISTEMA PINTEREST (VIA API) ====================
// services/pinterest.js

const fetch = require('node-fetch');

// ==================== BUSCAR IMAGENS NO PINTEREST (VIA API) ====================

async function buscarPinterest(query, limite = 1, CONFIG) {
    try {
        // 🔥 USA A API DO CONFIG
        const API_URL = CONFIG.apis.pinterest;
        
        console.log(`🔍 Buscando no Pinterest: "${query}" (${limite} imagens)`);
        
        const response = await fetch(`${API_URL}/api/public/pinterest?q=${encodeURIComponent(query)}&count=${limite}`);
        
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.ok || !data.images || data.images.length === 0) {
            return [];
        }
        
        return data.images.map(img => ({
            url: img.url,
            title: img.title || 'Sem título',
            link: img.link || ''
        }));
        
    } catch (err) {
        console.error('❌ Erro Pinterest:', err.message);
        return [];
    }
}

// ==================== FUNÇÃO PARA ENVIAR IMAGENS ====================

async function cmdPinterest(sock, chat, msg, args, enviarResposta, reagir, CONFIG) {
    // 🔥 VERIFICA SE O COMANDO ESTÁ ATIVO
    if (!CONFIG.comandos.pinterest) {
        await enviarResposta(chat, sock, `⛔ O comando °pinterest está desativado!`, msg);
        return;
    }

    const argsString = args.join(' ').trim();
    
    if (!argsString) {
        await enviarResposta(chat, sock, `📌 Use: ${CONFIG.prefix}pinterest <quantidade> <pesquisa>\n📌 Exemplo: ${CONFIG.prefix}pinterest 3 gatos fofos\n📌 Ou: ${CONFIG.prefix}pinterest gatos fofos`, msg);
        return;
    }

    let quantidade = 1;
    let query = argsString;

    const primeiroArg = args[0];
    const numero = parseInt(primeiroArg);

    if (!isNaN(numero) && numero >= 1 && numero <= CONFIG.pinterest.maxImages) {
        quantidade = numero;
        query = args.slice(1).join(' ').trim();
    }

    if (!query) {
        await enviarResposta(chat, sock, `📌 Digite o que você quer pesquisar!\n📌 Exemplo: ${CONFIG.prefix}pinterest gatos fofos`, msg);
        return;
    }

    await reagir(sock, chat, msg.key.id, '🔍');

    try {
        // 🔥 PASSA O CONFIG PARA A FUNÇÃO DE BUSCA
        const imagens = await buscarPinterest(query, quantidade, CONFIG);

        if (imagens.length === 0) {
            await enviarResposta(chat, sock, `❌ Nenhuma imagem encontrada para: "${query}"`, msg);
            await reagir(sock, chat, msg.key.id, '❌');
            return;
        }

        for (let i = 0; i < imagens.length; i++) {
            const img = imagens[i];
            const legenda = `╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ 🖼️ PINTEREST
┃ 📝 ${img.title || 'Sem título'}
┃ 🔗 ${img.link || ''}
┃ 📌 ${i+1}/${imagens.length}
╰━━━━━━━━━━━━━━━━━━━━━⬢
『 ${CONFIG.botNome} 』`;

            try {
                const response = await fetch(img.url);
                const buffer = Buffer.from(await response.arrayBuffer());

                await sock.sendMessage(chat, {
                    image: buffer,
                    caption: legenda
                }, { quoted: msg });

                if (i < imagens.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            } catch (err) {
                console.error(`❌ Erro ao enviar imagem ${i+1}:`, err.message);
            }
        }

        await reagir(sock, chat, msg.key.id, '✅');
        console.log(`✅ ${imagens.length} imagem(ns) do Pinterest enviada(s): "${query}"`);

    } catch (err) {
        console.error('❌ Erro no Pinterest:', err);
        await enviarResposta(chat, sock, `❌ Erro ao buscar imagens: ${err.message}`, msg);
        await reagir(sock, chat, msg.key.id, '❌');
    }
}

// ==================== EXPORTAR ====================

module.exports = {
    cmdPinterest,
    buscarPinterest
};