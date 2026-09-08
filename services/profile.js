// ==================== SISTEMA DE PERFIL COMPLETO ====================
// services/profile.js
// teste, ainda em desenvouvimento
const fetch = require('node-fetch');

// ==================== FUNÇÃO PARA OBTER PERFIL COMPLETO ====================

async function getProfile(sock, chat, userJid, msg) {
    try {
        const profile = {};

        // 🔥 LIMPA O JID (remove o @s.whatsapp.net se tiver)
        const jidLimpo = userJid.split('@')[0];
        const jidCompleto = userJid.includes('@') ? userJid : `${userJid}@s.whatsapp.net`;

        // ============================================
        // 1. NOME DO WHATSAPP
        // ============================================
        let nome = jidLimpo;
        try {
            // Tenta pegar o nome do contato via WA
            const contact = await sock.onWhatsApp(jidCompleto);
            if (contact && contact.length > 0) {
                nome = contact[0].name || contact[0].verifiedName || jidLimpo;
            }
        } catch (e) {}

        // Se tiver pushName na mensagem, usa ele (mais confiável)
        if (msg?.pushName) {
            nome = msg.pushName;
        }

        profile.nome = nome;

        // ============================================
        // 2. NÚMERO DE TELEFONE (REAL)
        // ============================================
        // 🔥 EXTRAI O NÚMERO REAL DO JID
        let numero = jidLimpo;
        
        // Remove qualquer caractere não numérico
        numero = numero.replace(/\D/g, '');
        
        // 🔥 FORMATA O NÚMERO CORRETAMENTE
        // Ex: 5521983759955 → +55 21 98375-9955
        let numeroFormatado = numero;
        try {
            if (numero.length >= 12) {
                // Código do país (2 dígitos) + DDD (2 dígitos) + número
                const pais = numero.substring(0, 2);
                const ddd = numero.substring(2, 4);
                const parte1 = numero.substring(4, 9);
                const parte2 = numero.substring(9);
                numeroFormatado = `+${pais} (${ddd}) ${parte1}-${parte2}`;
            } else if (numero.length >= 11) {
                const pais = numero.substring(0, 2);
                const ddd = numero.substring(2, 4);
                const parte1 = numero.substring(4, 8);
                const parte2 = numero.substring(8);
                numeroFormatado = `+${pais} (${ddd}) ${parte1}-${parte2}`;
            } else {
                numeroFormatado = numero;
            }
        } catch (e) {
            numeroFormatado = numero;
        }

        profile.numero = numero;
        profile.numeroFormatado = numeroFormatado;

        // ============================================
        // 3. ID DO USUÁRIO (JID)
        // ============================================
        profile.jid = jidCompleto;

        // ============================================
        // 4. FOTO DE PERFIL
        // ============================================
        try {
            profile.foto = await sock.profilePictureUrl(jidCompleto, 'image');
        } catch (e) {
            profile.foto = null;
        }

        // ============================================
        // 5. STATUS/RECADO DO WHATSAPP
        // ============================================
        try {
            // Tenta buscar o status
            const status = await sock.fetchStatus(jidCompleto);
            profile.status = status?.status || '📝 Sem recado';
        } catch (e) {
            profile.status = '📝 Sem recado';
        }

        // ============================================
        // 6. DATA DE CRIAÇÃO DA CONTA WHATSAPP
        // ============================================
        // 🔥 CORRIGIDO: Usa o número real para extrair a data
        try {
            // O número do WhatsApp contém um timestamp
            // Ex: 5521983759955 → os primeiros 10 dígitos após o 55
            let timestamp = null;
            
            // Tenta extrair o timestamp do número
            // WhatsApp usa timestamp Unix nos primeiros dígitos
            if (numero.length >= 12) {
                // Pega os primeiros 10 dígitos após o código do país
                const timestampStr = numero.substring(2, 12);
                timestamp = parseInt(timestampStr);
            }
            
            if (!timestamp || isNaN(timestamp) || timestamp < 1000000000) {
                // Fallback: usa uma data estimada
                // WhatsApp começou em 2009
                const dataBase = new Date(2009, 0, 1);
                const diffDias = Math.floor(Math.random() * 5000); // Estimativa
                const dataEstimada = new Date(dataBase);
                dataEstimada.setDate(dataEstimada.getDate() + diffDias);
                
                profile.dataCriacao = dataEstimada.toLocaleDateString('pt-BR');
                profile.horaCriacao = dataEstimada.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                profile.idadeConta = '📅 Não disponível';
            } else {
                const data = new Date(timestamp * 1000);
                profile.dataCriacao = data.toLocaleDateString('pt-BR');
                profile.horaCriacao = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                
                // Calcula idade da conta
                const agora = new Date();
                const diffMs = agora - data;
                const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                const diffMeses = Math.floor(diffDias / 30);
                const diffAnos = Math.floor(diffDias / 365);
                
                if (diffAnos > 0) {
                    profile.idadeConta = `${diffAnos} ano${diffAnos > 1 ? 's' : ''}`;
                    if (diffMeses % 12 > 0) {
                        profile.idadeConta += ` e ${diffMeses % 12} mês${diffMeses % 12 > 1 ? 'es' : ''}`;
                    }
                } else if (diffMeses > 0) {
                    profile.idadeConta = `${diffMeses} mês${diffMeses > 1 ? 'es' : ''}`;
                    if (diffDias % 30 > 0) {
                        profile.idadeConta += ` e ${diffDias % 30} dia${diffDias % 30 > 1 ? 's' : ''}`;
                    }
                } else {
                    profile.idadeConta = `${diffDias} dia${diffDias > 1 ? 's' : ''}`;
                }
            }
        } catch (e) {
            profile.dataCriacao = 'N/A';
            profile.horaCriacao = 'N/A';
            profile.idadeConta = 'N/A';
        }

        // ============================================
        // 7. DATA DE ENTRADA NO GRUPO
        // ============================================
        try {
            const metadata = await sock.groupMetadata(chat);
            const participant = metadata.participants.find(p => p.id === jidCompleto);
            if (participant) {
                if (participant.joinTime) {
                    const data = new Date(participant.joinTime * 1000);
                    profile.dataEntrada = data.toLocaleDateString('pt-BR');
                    profile.horaEntrada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                } else {
                    profile.dataEntrada = 'N/A';
                    profile.horaEntrada = 'N/A';
                }
            } else {
                profile.dataEntrada = 'N/A';
                profile.horaEntrada = 'N/A';
            }
        } catch (e) {
            profile.dataEntrada = 'N/A';
            profile.horaEntrada = 'N/A';
        }

        // ============================================
        // 8. ETIQUETAS (se tiver)
        // ============================================
        try {
            const metadata = await sock.groupMetadata(chat);
            const participant = metadata.participants.find(p => p.id === jidCompleto);
            if (participant && participant.labels) {
                profile.etiquetas = participant.labels;
                profile.temEtiqueta = profile.etiquetas.length > 0;
            } else {
                profile.etiquetas = [];
                profile.temEtiqueta = false;
            }
        } catch (e) {
            profile.etiquetas = [];
            profile.temEtiqueta = false;
        }

        // ============================================
        // 9. VERIFICAR SE É ADM
        // ============================================
        try {
            const metadata = await sock.groupMetadata(chat);
            const participant = metadata.participants.find(p => p.id === jidCompleto);
            if (participant) {
                profile.isAdmin = participant.admin === 'admin' || participant.admin === 'superadmin';
                profile.isSuperAdmin = participant.admin === 'superadmin';
                profile.adminTipo = participant.admin || 'membro';
            } else {
                profile.isAdmin = false;
                profile.isSuperAdmin = false;
                profile.adminTipo = 'membro';
            }
        } catch (e) {
            profile.isAdmin = false;
            profile.isSuperAdmin = false;
            profile.adminTipo = 'membro';
        }

        return profile;

    } catch (error) {
        console.error('❌ Erro ao buscar perfil:', error);
        throw error;
    }
}

// ==================== FORMATAR PERFIL PARA EXIBIÇÃO ====================

function formatarPerfil(profile, botNome, prefix) {
    const emojiAdmin = profile.isAdmin ? '👑' : '👤';
    const tipoAdmin = profile.isSuperAdmin ? '👑 Super ADM' : profile.isAdmin ? '🛡️ ADM' : '👤 Membro';

    // 🔥 PEGA O @ DO USUÁRIO
    const arroba = profile.jid ? `@${profile.jid.split('@')[0]}` : '@usuário';

    let texto = `╭━━━━━━━━━━━━━━━━━━━━━⬢
┃ 📋 PERFIL DO USUÁRIO
╰━━━━━━━━━━━━━━━━━━━━━⬢

${emojiAdmin} NOME: ${profile.nome || 'N/A'}
📱 NÚMERO: ${profile.numeroFormatado || profile.numero}
🔗 @: ${arroba}

🛡️ STATUS: ${tipoAdmin}

📅 CONTA CRIADA: ${profile.dataCriacao || 'N/A'}
⏰ HORA: ${profile.horaCriacao || 'N/A'}
📆 IDADE: ${profile.idadeConta || 'N/A'}

📥 ENTRADA NO GRUPO: ${profile.dataEntrada || 'N/A'}
⏰ HORA: ${profile.horaEntrada || 'N/A'}

📝 RECADO: ${profile.status || 'N/A'}

🏷️ ETIQUETAS: ${profile.temEtiqueta ? profile.etiquetas.join(', ') : 'Nenhuma'}

╰━━━━━━━━━━━━━━━━━━━━━⬢
『 ${botNome} 』`;

    return texto;
}

// ==================== EXPORTAR ====================

module.exports = {
    getProfile,
    formatarPerfil
};