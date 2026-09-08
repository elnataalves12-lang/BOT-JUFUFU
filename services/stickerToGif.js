// ==================== STICKER → GIF ====================
// services/stickerToGif.js
// Compatível com Android + Termux
// Não utiliza Sharp
//
// Uso:
// Responda a uma figurinha ANIMADA com:
// °sticker2gif
//
// Fluxo:
// WebP animado → FFmpeg → GIF → WhatsApp
// ======================================================

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

// ==================== CONFIGURAÇÃO ====================

const TEMP_DIR = path.join(os.tmpdir(), 'jufufu_sticker_gif');

// Cria a pasta temporária
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Limites para evitar GIFs absurdamente grandes
const MAX_GIF_SIZE = 15 * 1024 * 1024; // 15 MB
const MAX_DURATION = 15; // segundos
const MAX_FPS = 15;
const MAX_WIDTH = 480;

// ==================== VERIFICAR FFMPEG ====================

function verificarFFmpeg() {
    return new Promise((resolve) => {
        const ffmpeg = spawn('ffmpeg', ['-version']);

        let respondeu = false;

        ffmpeg.on('error', () => {
            if (!respondeu) {
                respondeu = true;
                resolve(false);
            }
        });

        ffmpeg.on('close', (code) => {
            if (!respondeu) {
                respondeu = true;
                resolve(code === 0);
            }
        });
    });
}

// ==================== EXECUTAR FFMPEG ====================

function executarFFmpeg(args) {
    return new Promise((resolve, reject) => {
        console.log('🎬 Executando FFmpeg...');

        const ffmpeg = spawn('ffmpeg', args);

        let stderr = '';

        ffmpeg.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        ffmpeg.on('error', (error) => {
            reject(error);
        });

        ffmpeg.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                console.error('❌ FFmpeg stderr:');
                console.error(stderr);

                reject(
                    new Error(
                        `FFmpeg terminou com código ${code}`
                    )
                );
            }
        });
    });
}

// ==================== VERIFICAR WEBP ====================

function isWebP(buffer) {
    if (!buffer || buffer.length < 12) return false;

    // RIFF....WEBP
    const riff = buffer.toString('ascii', 0, 4);
    const webp = buffer.toString('ascii', 8, 12);

    return riff === 'RIFF' && webp === 'WEBP';
}

// ==================== DETECTAR WEBP ANIMADO ====================

function isAnimatedWebP(buffer) {
    try {
        if (!isWebP(buffer)) {
            return false;
        }

        // Procuramos pelo chunk ANIM.
        // Em WebP animado normalmente existe:
        // RIFF + WEBP + VP8X + ANIM + ANMF
        const header = buffer.toString('ascii');

        return (
            header.includes('ANIM') ||
            header.includes('ANMF')
        );

    } catch (error) {
        console.error(
            '⚠️ Erro ao verificar animação:',
            error.message
        );

        return false;
    }
}

// ==================== OBTER DURAÇÃO ====================

function obterDuracao(input) {
    return new Promise((resolve) => {
        const ffprobe = spawn('ffprobe', [
            '-v',
            'error',
            '-show_entries',
            'format=duration',
            '-of',
            'default=noprint_wrappers=1:nokey=1',
            input
        ]);

        let output = '';

        ffprobe.stdout.on('data', (data) => {
            output += data.toString();
        });

        ffprobe.on('error', () => {
            // Se ffprobe não existir, continuamos normalmente.
            resolve(null);
        });

        ffprobe.on('close', () => {
            const duration = parseFloat(output.trim());

            if (Number.isFinite(duration)) {
                resolve(duration);
            } else {
                resolve(null);
            }
        });
    });
}

// ==================== CONVERTER WEBP → GIF ====================

async function converterWebPParaGif(input, output) {

    const palette = path.join(
        TEMP_DIR,
        `palette_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2)}.png`
    );

    try {

        // ==========================================
        // ETAPA 1 - GERAR PALETA
        // ==========================================

        console.log('🎨 Gerando paleta do GIF...');

        await executarFFmpeg([
            '-y',

            '-i',
            input,

            // Limita duração
            '-t',
            String(MAX_DURATION),

            // Redimensiona mantendo proporção
            '-vf',
            `fps=${MAX_FPS},scale=${MAX_WIDTH}:-1:flags=lanczos,palettegen=stats_mode=diff`,

            palette
        ]);

        // ==========================================
        // ETAPA 2 - GERAR GIF
        // ==========================================

        console.log('🖼️ Gerando GIF...');

        await executarFFmpeg([
            '-y',

            '-i',
            input,

            '-i',
            palette,

            '-t',
            String(MAX_DURATION),

            '-filter_complex',
            `[0:v]fps=${MAX_FPS},scale=${MAX_WIDTH}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=sierra2_4a:diff_mode=rectangle`,

            '-loop',
            '0',

            output
        ]);

        // ==========================================
        // VERIFICAR ARQUIVO
        // ==========================================

        if (!fs.existsSync(output)) {
            throw new Error(
                'O FFmpeg não criou o arquivo GIF.'
            );
        }

        const stats = fs.statSync(output);

        if (stats.size < 100) {
            throw new Error(
                'O GIF gerado ficou inválido ou vazio.'
            );
        }

        console.log(
            `✅ GIF criado: ${(stats.size / 1024 / 1024).toFixed(2)} MB`
        );

        return output;

    } finally {

        // Remove paleta temporária
        try {
            if (fs.existsSync(palette)) {
                fs.unlinkSync(palette);
            }
        } catch (error) {
            console.log(
                '⚠️ Não foi possível remover a paleta:',
                error.message
            );
        }
    }
}

// ==================== LIMPAR ARQUIVO ====================

function removerArquivo(file) {
    try {
        if (file && fs.existsSync(file)) {
            fs.unlinkSync(file);
        }
    } catch (error) {
        console.log(
            '⚠️ Erro ao remover arquivo temporário:',
            error.message
        );
    }
}

// ==================== LIMPAR TEMPORÁRIOS ANTIGOS ====================

function limparTemporarios() {
    try {

        if (!fs.existsSync(TEMP_DIR)) {
            return;
        }

        const agora = Date.now();

        const arquivos = fs.readdirSync(TEMP_DIR);

        for (const arquivo of arquivos) {

            const caminho = path.join(
                TEMP_DIR,
                arquivo
            );

            try {

                const stats = fs.statSync(caminho);

                // Remove arquivos com mais de 30 minutos
                if (
                    agora - stats.mtimeMs >
                    30 * 60 * 1000
                ) {
                    fs.unlinkSync(caminho);
                }

            } catch (_) {}
        }

    } catch (error) {
        console.log(
            '⚠️ Erro limpando temporários:',
            error.message
        );
    }
}

// ==================== COMANDO PRINCIPAL ====================

async function cmdStickerToGif(
    sock,
    chat,
    sender,
    msg,
    args,
    enviarResposta,
    reagir,
    downloadMediaMessage,
    P,
    CONFIG
) {

    // ==========================================
    // VERIFICAR SE ESTÁ ATIVADO
    // ==========================================

    if (
        CONFIG.comandos?.stickerToGif === false
    ) {

        await enviarResposta(
            chat,
            sock,
            '⛔ O comando °sticker2gif está desativado!',
            msg
        );

        return;
    }

    // ==========================================
    // PEGAR FIGURINHA RESPONDIDA
    // ==========================================

    const quoted =
        msg.message
            ?.extendedTextMessage
            ?.contextInfo
            ?.quotedMessage;

    if (
        !quoted ||
        !quoted.stickerMessage
    ) {

        await enviarResposta(
            chat,
            sock,
            `📌 Responda a uma figurinha animada com ${CONFIG.prefix}sticker2gif`,
            msg
        );

        return;
    }

    // ==========================================
    // VERIFICAR TIPO
    // ==========================================

    const stickerMessage =
        quoted.stickerMessage;

    // Figurinhas estáticas geralmente possuem
    // isAnimated false/undefined.
    //
    // Isso não é suficiente sozinho, então
    // também verificaremos o arquivo depois.

    if (
        stickerMessage.isAnimated === false
    ) {

        await enviarResposta(
            chat,
            sock,
            '⚠️ Essa figurinha parece ser estática.\n\n📌 O comando °sticker2gif funciona apenas com figurinhas animadas.',
            msg
        );

        return;
    }

    await reagir(
        sock,
        chat,
        msg.key.id,
        '🔄'
    );

    let inputFile = null;
    let outputFile = null;

    try {

        // ==========================================
        // VERIFICAR FFMPEG
        // ==========================================

        const ffmpegExiste =
            await verificarFFmpeg();

        if (!ffmpegExiste) {

            throw new Error(
                'FFmpeg não foi encontrado no Termux. Instale o FFmpeg antes de usar este comando.'
            );
        }

        // ==========================================
        // LIMPAR TEMPORÁRIOS ANTIGOS
        // ==========================================

        limparTemporarios();

        // ==========================================
        // BAIXAR FIGURINHA
        // ==========================================

        console.log(
            '📥 Baixando figurinha...'
        );

        const target = {
            message: quoted,
            key: msg.key
        };

        const buffer =
            await downloadMediaMessage(
                target,
                'buffer',
                {},
                {
                    logger: P({
                        level: 'silent'
                    })
                }
            );

        if (
            !buffer ||
            buffer.length < 100
        ) {

            throw new Error(
                'Não foi possível baixar a figurinha.'
            );
        }

        // ==========================================
        // VERIFICAR WEBP
        // ==========================================

        if (!isWebP(buffer)) {

            throw new Error(
                'O arquivo baixado não parece ser um WebP válido.'
            );
        }

        // ==========================================
        // VERIFICAR SE É ANIMADO
        // ==========================================

        const animado =
            isAnimatedWebP(buffer);

        if (!animado) {

            await reagir(
                sock,
                chat,
                msg.key.id,
                '⚠️'
            );

            await enviarResposta(
                chat,
                sock,
                '⚠️ Essa figurinha não parece ser animada.\n\n📌 O °sticker2gif precisa de uma figurinha animada.',
                msg
            );

            return;
        }

        console.log(
            `🎞️ Figurinha animada detectada (${(buffer.length / 1024).toFixed(1)} KB)`
        );

        // ==========================================
        // CRIAR NOMES TEMPORÁRIOS
        // ==========================================

        const id =
            `${Date.now()}_${Math.random()
                .toString(36)
                .slice(2)}`;

        inputFile = path.join(
            TEMP_DIR,
            `sticker_${id}.webp`
        );

        outputFile = path.join(
            TEMP_DIR,
            `sticker_${id}.gif`
        );

        // ==========================================
        // SALVAR WEBP
        // ==========================================

        fs.writeFileSync(
            inputFile,
            buffer
        );

        // ==========================================
        // PEGAR DURAÇÃO
        // ==========================================

        const duration =
            await obterDuracao(inputFile);

        if (duration) {

            console.log(
                `⏱️ Duração: ${duration.toFixed(2)}s`
            );

            if (duration > MAX_DURATION) {

                console.log(
                    `⚠️ Figurinha maior que ${MAX_DURATION}s. Será cortada.`
                );
            }
        }

        // ==========================================
        // CONVERTER
        // ==========================================

        await converterWebPParaGif(
            inputFile,
            outputFile
        );

        // ==========================================
        // VERIFICAR TAMANHO
        // ==========================================

        const gifStats =
            fs.statSync(outputFile);

        if (
            gifStats.size >
            MAX_GIF_SIZE
        ) {

            console.log(
                `⚠️ GIF ficou grande: ${(gifStats.size / 1024 / 1024).toFixed(2)} MB`
            );

            // Tenta uma segunda conversão
            // mais leve para Android/WhatsApp.

            const outputSmall =
                path.join(
                    TEMP_DIR,
                    `sticker_${id}_small.gif`
                );

            await executarFFmpeg([
                '-y',

                '-i',
                inputFile,

                '-t',
                String(MAX_DURATION),

                '-vf',
                'fps=10,scale=360:-1:flags=lanczos',

                '-loop',
                '0',

                outputSmall
            ]);

            if (
                fs.existsSync(outputSmall)
            ) {

                const smallStats =
                    fs.statSync(outputSmall);

                if (
                    smallStats.size <
                    gifStats.size
                ) {

                    removerArquivo(
                        outputFile
                    );

                    outputFile =
                        outputSmall;

                    console.log(
                        `📦 GIF reduzido para ${(smallStats.size / 1024 / 1024).toFixed(2)} MB`
                    );
                } else {

                    removerArquivo(
                        outputSmall
                    );
                }
            }
        }

        // ==========================================
        // LER GIF
        // ==========================================

        const gifBuffer =
            fs.readFileSync(outputFile);

        if (
            !gifBuffer ||
            gifBuffer.length < 100
        ) {

            throw new Error(
                'GIF inválido.'
            );
        }

        // ==========================================
        // ENVIAR COMO GIF
        // ==========================================
        //
        // No WhatsApp/Baileys, GIF é enviado
        // como vídeo com gifPlayback: true.
        //
        // Isso faz o WhatsApp mostrar como GIF.

        const botNome =
            CONFIG?.botNome ||
            'JUFUFU Bot';

        console.log(
            '📤 Enviando GIF...'
        );

        await sock.sendMessage(
            chat,
            {
                video: gifBuffer,

                gifPlayback: true,

                caption:
                    `🎞️ Figurinha convertida para GIF!\n` +
                    `📦 ${(gifBuffer.length / 1024 / 1024).toFixed(2)} MB\n` +
                    `『 ${botNome} 』`
            },
            {
                quoted: msg
            }
        );

        // ==========================================
        // SUCESSO
        // ==========================================

        await reagir(
            sock,
            chat,
            msg.key.id,
            '✅'
        );

        console.log(
            '✅ Sticker → GIF concluído!'
        );

    } catch (error) {

        console.error(
            '❌ Erro sticker2gif:',
            error
        );

        await enviarResposta(
            chat,
            sock,
            `❌ Não foi possível transformar a figurinha em GIF.\n\n📌 Erro: ${error.message}`,
            msg
        );

        await reagir(
            sock,
            chat,
            msg.key.id,
            '❌'
        );

    } finally {

        // ==========================================
        // LIMPAR ARQUIVOS
        // ==========================================

        removerArquivo(
            inputFile
        );

        removerArquivo(
            outputFile
        );
    }
}

// ==================== EXPORTAR ====================

module.exports = {
    cmdStickerToGif,
    isAnimatedWebP,
    isWebP,
    verificarFFmpeg
};