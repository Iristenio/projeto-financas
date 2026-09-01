const API_URL = 'https://script.google.com/macros/s/AKfycbwB3fd12EsBaAnI7d3YYJt79xNrM24dwqg35jL4SnxEnDhmwQudj7B36b5qh5xYU6XP/exec';
const CHAVE_TOKEN = 'financas-token';

function obterToken() {
  return localStorage.getItem(CHAVE_TOKEN);
}

function definirToken(token) {
  localStorage.setItem(CHAVE_TOKEN, token);
}

function limparToken() {
  localStorage.removeItem(CHAVE_TOKEN);
}

/**
 * @param {string} recurso
 * @param {Object} [params] - parâmetros extras de query string
 */
async function apiGet(recurso, params) {
  const query = new URLSearchParams(Object.assign({ token: obterToken() || '', recurso: recurso }, params || {}));
  const resposta = await fetch(API_URL + '?' + query.toString());
  const json = await resposta.json();
  if (!json.ok) throw new Error(json.erro);
  return json.dados;
}

/**
 * @param {string} recurso
 * @param {string} acao
 * @param {Object} [extra] - demais campos do corpo (dados, id, ...)
 */
async function apiPost(recurso, acao, extra) {
  const corpo = Object.assign({ recurso: recurso, acao: acao }, extra || {});
  const resposta = await fetch(API_URL + '?token=' + encodeURIComponent(obterToken() || ''), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(corpo),
  });
  const json = await resposta.json();
  if (!json.ok) throw new Error(json.erro);
  return json.dados;
}
