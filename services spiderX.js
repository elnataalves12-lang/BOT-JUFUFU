// ==================== SPIDER X API ====================
// services/spiderX.js
// ============================================================

const axios = require('axios');
const CONFIG = require('../config.js');

// ==================== CONFIGURAÇÃO ====================
const SPIDER_API_BASE_URL = CONFIG.spiderX?.baseUrl || 'https://api.spiderx.com.br/api';
const SPIDER_API_TOKEN = CONFIG.spiderX?.token || '';

// ==================== VALIDAR TOKEN ====================

function isSpiderApiTokenConfigured(token) {
    return token && token.trim() !== '' && token !== 'seu_token_aqui';
}

function requireSpiderApiToken() {
    const token = SPIDER_API_TOKEN;
    
    if (!isSpiderApiTokenConfigured(token)) {
        throw new Error(
            `Token da API do Spider X não configurado!\n\n` +
            `Para configurar, edite o arquivo config.js:\n\n` +
            `spiderX: {\n` +
            `    baseUrl: "https://api.spiderx.com.br/api",\n` +
            `    token: "seu_token_aqui",\n` +
            `    timeout: 30000\n` +
            `}\n\n` +
            `Para obter o seu token, crie uma conta em: https://api.spiderx.com.br`
        );
    }
    
    return token;
}

// ==================== PLAY ====================

async function play(type, search) {
    if (!search) {
        throw new Error('Você precisa informar o que deseja buscar!');
    }

    const spiderApiToken = requireSpiderApiToken();

    const url = `${SPIDER_API_BASE_URL}/downloads/play-${type}?search=${encodeURIComponent(search)}&api_key=${spiderApiToken}`;

    const response = await axios.get(url, {
        timeout: CONFIG.spiderX?.timeout || 30000,
        headers: {
            'Content-Type': 'application/json'
        }
    });

    return response.data;
}

// ==================== DOWNLOAD ====================

async function download(type, url) {
    if (!url) {
        throw new Error('Você precisa informar uma URL do que deseja baixar!');
    }

    const spiderApiToken = requireSpiderApiToken();

    const response = await axios.get(
        `${SPIDER_API_BASE_URL}/downloads/${type}?url=${encodeURIComponent(url)}&api_key=${spiderApiToken}`,
        {
            timeout: CONFIG.spiderX?.timeout || 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );

    return response.data;
}

// ==================== OUTRAS FUNÇÕES ====================

async function facebook(url) {
    return download('facebook', url);
}

async function xTwitter(url) {
    return download('x-twitter', url);
}

async function imageAI(description) {
    if (!description) {
        throw new Error('Você precisa informar a descrição da imagem!');
    }

    const spiderApiToken = requireSpiderApiToken();

    const response = await axios.get(
        `${SPIDER_API_BASE_URL}/ai/flux?text=${encodeURIComponent(description)}&api_key=${spiderApiToken}`,
        {
            timeout: CONFIG.spiderX?.timeout || 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );

    return response.data;
}

async function pinterest(search) {
    if (!search) {
        throw new Error('Você precisa informar o parâmetro de pesquisa!');
    }

    const spiderApiToken = requireSpiderApiToken();

    const response = await axios.get(
        `${SPIDER_API_BASE_URL}/downloads/pinterest?search=${encodeURIComponent(search)}&api_key=${spiderApiToken}`,
        {
            timeout: CONFIG.spiderX?.timeout || 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );

    return response.data;
}

function attp(text) {
    if (!text) {
        throw new Error('Você precisa informar o parâmetro de texto!');
    }

    const spiderApiToken = requireSpiderApiToken();

    return `${SPIDER_API_BASE_URL}/stickers/attp?text=${encodeURIComponent(text)}&api_key=${spiderApiToken}`;
}

function ttp(text) {
    if (!text) {
        throw new Error('Você precisa informar o parâmetro de texto!');
    }

    const spiderApiToken = requireSpiderApiToken();

    return `${SPIDER_API_BASE_URL}/stickers/ttp?text=${encodeURIComponent(text)}&api_key=${spiderApiToken}`;
}

function brat(text) {
    if (!text) {
        throw new Error('Você precisa informar o parâmetro de texto!');
    }

    const spiderApiToken = requireSpiderApiToken();

    return `${SPIDER_API_BASE_URL}/stickers/brat?text=${encodeURIComponent(text)}&api_key=${spiderApiToken}`;
}

// ==================== EXPORTAR ====================

module.exports = {
    play,
    download,
    facebook,
    xTwitter,
    imageAI,
    pinterest,
    attp,
    ttp,
    brat,
};