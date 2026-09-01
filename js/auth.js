/**
 * Login por token (ver docs/modelo-de-dados.md — sem login Google).
 * Resolve `window.pessoaAtual` e dispara o callback quando a
 * sessão está pronta; senão mostra a tela de login.
 */
function iniciarSessao(aoAutenticar) {
  const telaLogin = document.getElementById('tela-login');
  const telaApp = document.getElementById('tela-app');
  const formLogin = document.getElementById('form-login');
  const loginErro = document.getElementById('login-erro');
  const btnSair = document.getElementById('btn-sair');
  const btnMenu = document.getElementById('btn-menu');

  async function tentarEntrar() {
    const token = obterToken();
    if (!token) {
      mostrarLogin();
      return;
    }
    try {
      const pessoa = await apiGet('quem-sou-eu');
      window.pessoaAtual = pessoa;
      telaLogin.hidden = true;
      telaApp.hidden = false;
      btnSair.hidden = false;
      btnMenu.hidden = false;
      aoAutenticar(pessoa);
    } catch (erro) {
      limparToken();
      mostrarLogin(erro.message);
    }
  }

  function mostrarLogin(mensagemErro) {
    telaApp.hidden = true;
    telaLogin.hidden = false;
    btnSair.hidden = true;
    btnMenu.hidden = true;
    if (mensagemErro) {
      loginErro.textContent = mensagemErro;
      loginErro.hidden = false;
    }
  }

  formLogin.addEventListener('submit', async (event) => {
    event.preventDefault();
    loginErro.hidden = true;
    const token = document.getElementById('token').value.trim();
    definirToken(token);
    await tentarEntrar();
  });

  btnSair.addEventListener('click', () => {
    limparToken();
    window.location.reload();
  });

  tentarEntrar();
}
