// ==================== CONFIG.JS ====================
// Arquivo de configuração do bot - JUFUFU BOT

module.exports = {
    // ================================================================
    // 1. INFORMAÇÕES BÁSICAS
    // ================================================================
    prefix: "°",
    botNome: "𝙹𝚄𝙵𝚄𝙵𝚄-ᶻᶻᶻ_b̶o҈꓄",
    donoOriginal: "5591984457350",
    versao: "3.0",

    // ================================================================
    // 👑 DONOS DO BOT (NÚMEROS AUTORIZADOS)
    // ================================================================
    donos: [
        "5591984457350",  
        "559184457350",  
    ],

    // ================================================================
    // 2. LINKS/APIs DOS COMANDOS
    // ================================================================
    apis: {
        sunny: "https://sunshine-imagination.lovable.app",
        pinterest: "https://ju-fufu-pin-vision.lovable.app"
    },

    // ================================================================
    // 🕷️ SPIDER X API
    // ================================================================
    spiderX: {
        baseUrl: "https://api.spiderx.com.br/api",  // 🔥 URL CORRETA
        token: "Rpi2GGn2GuVXAtCI2mmR",
        timeout: 30000
    },

    // ================================================================
    // 3. ATIVAÇÃO/DESATIVAÇÃO DOS COMANDOS
    // ================================================================
    comandos: {
        play: true,
        yt: true,
        img: true,
        pinterest: true,
        sticker: true,
        audio: true,
        stickerToMedia: true,
        stickerToGif: true
    },

    // ================================================================
    // 4. CONFIGS ESPECÍFICAS
    // ================================================================
    pinterest: {
        maxImages: 5,
        timeout: 10000
    },

    youtube: {
        maxDuration: 1800,
        maxSize: 50 * 1024 * 1024
    },

    sunny: {
        format: "png",
        timeout: 30000
    },

    play: {
        maxDuration: 600,
        maxRetries: 2
    },

    // ================================================================
    // 5. MENU - IMAGENS
    // ================================================================
    menu: {
        image: "https://wivkiglslhvvmutsexlx.supabase.co/storage/v1/object/public/uploads/1786021174615-an8w5j.png",
        audio: "https://tdxokdmiqtdqwqsegqkd.supabase.co/storage/v1/object/public/media/chat/f78f5e92-5a2e-498e-acf6-5275205e3986/1783283000316-9io7m0.mp3",
        imageDono: "https://wivkiglslhvvmutsexlx.supabase.co/storage/v1/object/public/uploads/1786021174615-an8w5j.png",
        audioDono: "https://tdxokdmiqtdqwqsegqkd.supabase.co/storage/v1/object/public/media/chat/f78f5e92-5a2e-498e-acf6-5275205e3986/1783283000316-9io7m0.mp3"
    },

    // ================================================================
    // 6. GIFS DE CARREGAMENTO (PLAY)
    // ================================================================
    gifs: {
        carregamento1: "https://wivkiglslhvvmutsexlx.supabase.co/storage/v1/object/public/uploads/1785162458202-48v33r.mp4",
        carregamento2: "https://wivkiglslhvvmutsexlx.supabase.co/storage/v1/object/public/uploads/1785162430507-egabq7.mp4"
    },

    // ================================================================
    // 7. STICKER
    // ================================================================
    sticker: {
        packName: "Jufufu BOT",
        author: "jufufu • +55 91 8445-7350",
        maxVideoDuration: 10,
        quality: 90
    },

    // ================================================================
    // 8. RANKINGS - IMAGENS
    // ================================================================
    rankings: {
        imagens: {
            feio: "https://wivkiglslhvvmutsexlx.supabase.co/storage/v1/object/public/uploads/1786314733396-l1tfjp.jpg",
            bonito: "https://wivkiglslhvvmutsexlx.supabase.co/storage/v1/object/public/uploads/1786314639750-d78qfh.jpg",
            corno: "https://wivkiglslhvvmutsexlx.supabase.co/storage/v1/object/public/uploads/1786314666040-kw7kt0.jpg",
            gay: "https://wivkiglslhvvmutsexlx.supabase.co/storage/v1/object/public/uploads/1786314679379-gw8j24.png",
            fofo: "https://wivkiglslhvvmutsexlx.supabase.co/storage/v1/object/public/uploads/1786314702204-hsh2eo.png",
            doido: "https://wivkiglslhvvmutsexlx.supabase.co/storage/v1/object/public/uploads/1786314719313-4p38hs.png"
        }
    },

    // ================================================================
    // 9. STICKER EFFECTS
    // ================================================================
    stickerEffects: {
        useApi: true,
        maxVideoDuration: 10,
        effects: [
            "aura", "coracao", "galaxia", "anjo", "eletrico",
            "fogo", "gelo", "raio", "sangue", "ouro", "holograma",
            "fumaca", "chuva", "matrix", "neon", "glitch", "vhs",
            "comic", "popart", "preto", "vintage", "pixel", "grade"
        ]
    },

    // ================================================================
    // 10. ANTI-PALAVRÃO
    // ================================================================
    antiPalavrao: {
        modoPadrao: 1,
        limiteAlertas: 4,
        tempoLimite: 10000
    }
};