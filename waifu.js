// ==================== WAIFU E NEKO ====================
// services/waifu.js
// ============================================================
// WAIFU → Waifu.im
// NEKO  → nekos.life
//
// Os dois comandos são totalmente independentes.
// ============================================================

const axios = require('axios');

// ============================================================
// 1. WAIFU
// ============================================================

async function cmdWaifu(sock, chat, msg, enviarResposta, reagir, CONFIG) {
    try {
        await reagir(sock, chat, msg.key.id, '⏳');

        // ====================================================
        // WAIFU.IM
        // ====================================================
        // SFW por padrão.
        // Procuramos imagens maiores para evitar imagens
        // pequenas quando houver opções disponíveis.
        // ====================================================

        const res = await axios.get(
            'https://api.waifu.im/images',
            {
                params: {
                    IncludedTags: 'waifu',
                    IsNsfw: 'False',
                    PageSize: 10,
                    MinWidth: 1000,
                    MinHeight: 1000
                },
                headers: {
                    'Accept-Version': 'v7',
                    'Accept': 'application/json'
                },
                timeout: 15000
            }
        );

        if (
            !res.data ||
            !Array.isArray(res.data.items) ||
            res.data.items.length === 0
        ) {
            throw new Error('Waifu.im não retornou nenhuma imagem.');
        }

        // Escolhe uma das imagens retornadas aleatoriamente.
        const item =
            res.data.items[
                Math.floor(Math.random() * res.data.items.length)
            ];

        if (!item.url) {
            throw new Error('A imagem retornada não possui URL.');
        }

        // ====================================================
        // BAIXAR IMAGEM ORIGINAL
        // ====================================================

        const img = await axios.get(item.url, {
            responseType: 'arraybuffer',
            timeout: 30000,
            maxContentLength: 25 * 1024 * 1024,
            maxBodyLength: 25 * 1024 * 1024
        });

        if (!img.data || img.data.length === 0) {
            throw new Error('A imagem retornada está vazia.');
        }

        const largura = item.width || '?';
        const altura = item.height || '?';

        const legenda = `╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ ✨ *WAIFU*
╰━━━━━━━━━━━━━━━━━━━━━⬢

┃ 🎀 To, sua Waifu.
╰━━━━━━━━━━━━━━━━━━━━━⬢
『 ${CONFIG.botNome} 』`;

        await sock.sendMessage(
            chat,
            {
                image: Buffer.from(img.data),
                caption: legenda
            },
            {
                quoted: msg
            }
        );

        await reagir(sock, chat, msg.key.id, '✅');

    } catch (error) {
        console.error('❌ Erro na waifu:', error.message);

        try {
            await enviarResposta(
                chat,
                sock,
                `╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ ❌ *XIUU, DEU ERRO NA WAIFU*
╰━━━━━━━━━━━━━━━━━━━━━⬢
『 ${CONFIG.botNome} 』`,
                msg
            );
        } catch (_) {}

        try {
            await reagir(sock, chat, msg.key.id, '❌');
        } catch (_) {}
    }
}

// ============================================================
// 2. NEKO
// ============================================================
// IMPORTANTE:
// Este comando continua usando a API original.
// Nenhuma parte da WAIFU é utilizada aqui.
// ============================================================

async function cmdNeko(sock, chat, msg, enviarResposta, reagir, CONFIG) {
    try {
        await reagir(sock, chat, msg.key.id, '⏳');

        const res = await axios.get(
            'https://nekos.life/api/v2/img/neko',
            {
                timeout: 10000
            }
        );

        if (!res.data || !res.data.url) {
            throw new Error('A API não retornou uma URL válida.');
        }

        const imgUrl = res.data.url;

        const img = await axios.get(imgUrl, {
            responseType: 'arraybuffer',
            timeout: 15000
        });

        const legenda = `╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ 🐱 *NEKO*
╰━━━━━━━━━━━━━━━━━━━━━⬢

┃ 🌸Aqui esta sua neko.

╰━━━━━━━━━━━━━━━━━━━━━⬢
『 ${CONFIG.botNome} 』`;

        await sock.sendMessage(
            chat,
            {
                image: Buffer.from(img.data),
                caption: legenda
            },
            {
                quoted: msg
            }
        );

        await reagir(sock, chat, msg.key.id, '🐱');

    } catch (error) {
        console.error('❌ Erro na neko:', error.message);

        try {
            await enviarResposta(
                chat,
                sock,
                `╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ ❌ *ACHO QUE DEU ERRO NA NEKO*
╰━━━━━━━━━━━━━━━━━━━━━⬢
『 ${CONFIG.botNome} 』`,
                msg
            );
        } catch (_) {}

        try {
            await reagir(sock, chat, msg.key.id, '❌');
        } catch (_) {}
    }
}

// ============================================================
// EXPORTAR
// ============================================================

module.exports = {
    cmdWaifu,
    cmdNeko
};