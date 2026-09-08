// ==================== SISTEMA YOUTUBE ====================
// services/youtube.js

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// ==================== CONFIGURAÇÃO ====================
const DOWNLOADS_VIDEO = path.join(process.cwd(), 'downloads_video');
if (!fs.existsSync(DOWNLOADS_VIDEO)) fs.mkdirSync(DOWNLOADS_VIDEO, { recursive: true });

// ==================== PARSING ====================
const YT_RE = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

function parseYt(body) {
    if (!body || typeof body !== 'string') return null;
    const texto = body.replace(/^[°º!\/.]?yt\s+/i, '').trim();
    if (!texto) return null;
    
    const id = texto.match(YT_RE);
    if (id) return { tipo: "url", url: "https://www.youtube.com/watch?v=" + id[1] };
    if (/^[A-Za-z0-9_-]{11}$/.test(texto)) return { tipo: "url", url: "https://www.youtube.com/watch?v=" + texto };
    if (/^https?:\/\//i.test(texto)) return { tipo: "url", url: texto };
    return { tipo: "busca", termo: texto };
}

// ==================== BUSCAR VÍDEO ====================
function buscarVideoYtdlp(termo) {
    return new Promise((resolve, reject) => {
        const p = spawn("yt-dlp", [
            "--no-playlist", "--default-search", "ytsearch1",
            "--flat-playlist", "--skip-download", "--print", "%(id)s",
            "--no-check-certificate",
            termo,
        ]);
        let out = "", err = "";
        p.stdout.on("data", d => out += d.toString());
        p.stderr.on("data", d => err += d.toString());
        p.on("close", code => {
            const id = out.trim().split(/\r?\n/).filter(Boolean)[0];
            if (code !== 0 || !id) {
                return reject(new Error(err.trim() || "Vídeo não encontrado"));
            }
            resolve("https://www.youtube.com/watch?v=" + id);
        });
        p.on("error", () => reject(new Error("yt-dlp não está instalado")));
    });
}

// ==================== BAIXAR VÍDEO ====================
function baixarVideo(url) {
    return new Promise((resolve, reject) => {
        const safeName = Date.now() + '_' + Math.random().toString(36).substring(7);
        const outputPath = path.join(DOWNLOADS_VIDEO, `${safeName}.mp4`);
        
        const p = spawn("yt-dlp", [
            "-f", "best[ext=mp4]/best",
            "--no-playlist",
            "--no-warnings",
            "--no-part",
            "--no-mtime",
            "--concurrent-fragments", "16",
            "-N", "16",
            "--extractor-args", "youtube:player_client=android,web",
            "--add-header", "User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "--add-header", "Accept:text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "--add-header", "Accept-Language:en-us,en;q=0.5",
            "--add-header", "Sec-Fetch-Mode:navigate",
            "--no-check-certificate",
            "--socket-timeout", "30",
            "--retries", "5",
            "--fragment-retries", "5",
            "-o", outputPath,
            "--print", "after_move:filepath",
            "--print", "title",
            url,
        ]);
        
        let out = "", err = "";
        p.stdout.on("data", d => out += d.toString());
        p.stderr.on("data", d => err += d.toString());
        
        p.on("close", code => {
            if (code !== 0) {
                fallbackVideo(url, outputPath).then(resolve).catch(reject);
                return;
            }
            
            const lines = out.trim().split(/\r?\n/).filter(Boolean);
            const file = lines.find(l => l.endsWith('.mp4')) || lines[0];
            const title = lines.find(l => l !== file) || path.basename(file, '.mp4');
            
            if (!file || !fs.existsSync(file)) {
                reject(new Error("Arquivo não encontrado"));
                return;
            }
            
            resolve({ file, title });
        });
        
        p.on("error", () => {
            fallbackVideo(url, outputPath).then(resolve).catch(reject);
        });
    });
}

// ==================== FALLBACK ====================
function fallbackVideo(url, outputPath) {
    return new Promise((resolve, reject) => {
        const p = spawn("yt-dlp", [
            "-f", "best[ext=mp4]/best",
            "--no-playlist",
            "--no-warnings",
            "--no-part",
            "--no-mtime",
            "--extractor-args", "youtube:player_client=android",
            "--add-header", "User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "--no-check-certificate",
            "--retries", "3",
            "-o", outputPath,
            "--print", "after_move:filepath",
            "--print", "title",
            url,
        ]);
        
        let out = "", err = "";
        p.stdout.on("data", d => out += d.toString());
        p.stderr.on("data", d => err += d.toString());
        
        p.on("close", code => {
            if (code !== 0) {
                reject(new Error(err.trim() || "Falha no download"));
                return;
            }
            
            const lines = out.trim().split(/\r?\n/).filter(Boolean);
            const file = lines.find(l => l.endsWith('.mp4')) || lines[0];
            const title = lines.find(l => l !== file) || path.basename(file, '.mp4');
            
            if (!file || !fs.existsSync(file)) {
                reject(new Error("Arquivo não encontrado"));
                return;
            }
            
            resolve({ file, title });
        });
        p.on("error", reject);
    });
}

// ==================== FUNÇÃO PRINCIPAL ====================
async function cmdYt(sock, chat, sender, msg, args, enviarResposta, reagir, CONFIG) {
    // 🔥 VERIFICA SE enviarResposta É UMA FUNÇÃO
    const enviar = typeof enviarResposta === 'function' ? enviarResposta : async (chat, sock, texto, msg) => {
        try {
            await sock.sendMessage(chat, { text: texto }, { quoted: msg });
        } catch (e) {
            console.error('❌ Erro ao enviar resposta:', e.message);
        }
    };

    if (!CONFIG.comandos?.yt) {
        await enviar(chat, sock, '⛔ O comando °yt está desativado!', msg);
        return;
    }

    const query = Array.isArray(args) ? args.join(' ').trim() : String(args || '').trim();
    if (!query) {
        await enviar(chat, sock, `📹 Digite o nome do vídeo!\n📌 Exemplo: ${CONFIG.prefix}yt montagem HAKARI`, msg);
        return;
    }

    if (typeof reagir === 'function') {
        await reagir(sock, chat, msg.key.id, '🎬');
    }

    try {
        const pedido = parseYt(query);
        if (!pedido) {
            await enviar(chat, sock, '❌ Comando inválido! Use °yt <vídeo>', msg);
            return;
        }

        let url;
        if (pedido.tipo === "url") {
            url = pedido.url;
            await enviar(chat, sock, '🔗 Link recebido, baixando...', msg);
        } else {
            await enviar(chat, sock, `🔎 Procurando "${pedido.termo}"...`, msg);
            url = await buscarVideoYtdlp(pedido.termo);
            if (!url) {
                await enviar(chat, sock, '❌ Vídeo não encontrado!', msg);
                return;
            }
        }

        const { file, title } = await baixarVideo(url);
        
        if (!file || !fs.existsSync(file)) {
            throw new Error('Arquivo não encontrado');
        }

        const stats = fs.statSync(file);
        if (stats.size < 10000) {
            throw new Error('Arquivo muito pequeno, download falhou');
        }

        await sock.sendMessage(chat, {
            video: { url: file },
            caption: `🎬 *${title || 'Vídeo'}*\n📡 YouTube\n📥 Baixado agora`,
            mimetype: 'video/mp4'
        }, { quoted: msg });

        setTimeout(() => {
            try { fs.unlinkSync(file); } catch (e) {}
        }, 5000);

        if (typeof reagir === 'function') {
            await reagir(sock, chat, msg.key.id, '✅');
        }
        console.log(`✅ Vídeo enviado: ${title}`);

    } catch (error) {
        console.error('❌ Erro no YouTube:', error.message);
        await enviar(chat, sock, `❌ Erro ao baixar vídeo: ${error.message}`, msg);
        if (typeof reagir === 'function') {
            await reagir(sock, chat, msg.key.id, '❌');
        }
    }
}

// ==================== EXPORTAR ====================
module.exports = {
    cmdYt,
    parseYt,
    buscarVideoYtdlp,
    baixarVideo
};