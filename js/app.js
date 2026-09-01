if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch((erro) => {
      console.error('Falha ao registrar service worker:', erro);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const saudacao = document.getElementById('saudacao');
  const bloqueioColaborador = document.getElementById('bloqueio-colaborador');
  const areaAdmin = document.getElementById('area-admin');

  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanels = {
    lancar: document.getElementById('tab-lancar'),
    historico: document.getElementById('tab-historico'),
  };

  const form = document.getElementById('form-gasto');
  const selectCategoria = document.getElementById('categoria');
  const selectMeioPagamento = document.getElementById('meioPagamento');
  const selectPessoa = document.getElementById('pessoa');
  const inputData = document.getElementById('data');
  const gastoErro = document.getElementById('gasto-erro');
  const btnSalvar = form.querySelector('.btn-salvar');
  const textoBtnSalvar = btnSalvar.textContent;

  const filtroMes = document.getElementById('filtro-mes');
  const listaHistorico = document.getElementById('lista-historico');
  const historicoVazio = document.getElementById('historico-vazio');
  const historicoCarregando = document.getElementById('historico-carregando');

  let idEmEdicao = null;

  function mesAtual() {
    const hoje = new Date();
    return hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0');
  }

  function preencherDataHoje() {
    const hoje = new Date();
    const offset = hoje.getTimezoneOffset();
    const local = new Date(hoje.getTime() - offset * 60 * 1000);
    inputData.value = local.toISOString().split('T')[0];
  }

  function formatarValor(valor) {
    return 'R$ ' + Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatarData(dataIso) {
    const d = new Date(dataIso);
    return String(d.getUTCDate()).padStart(2, '0') + '/' + String(d.getUTCMonth() + 1).padStart(2, '0') + '/' + d.getUTCFullYear();
  }

  async function popularSelect(select, itens, valorSelecionado) {
    select.innerHTML = '';
    itens.forEach((item) => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.nome;
      select.appendChild(option);
    });
    if (valorSelecionado !== undefined) {
      select.value = valorSelecionado;
    }
  }

  async function carregarListasDeApoio() {
    const [categorias, meiosPagamento, pessoas] = await Promise.all([
      apiGet('categorias'),
      apiGet('meios-pagamento', { tipo: 'Pronto Pagamento' }),
      apiGet('pessoas'),
    ]);
    await popularSelect(selectCategoria, categorias);
    await popularSelect(selectMeioPagamento, meiosPagamento);
    await popularSelect(selectPessoa, pessoas, window.pessoaAtual.id);
  }

  function entrarEmEdicao(gasto) {
    document.querySelector('[data-tab="lancar"]').click();

    document.getElementById('valor').value = gasto.Valor;
    selectCategoria.value = gasto.Categoria_ID;
    selectMeioPagamento.value = gasto.MeioPagamento_ID;
    selectPessoa.value = gasto.Pessoa_ID;
    document.getElementById('descricao').value = gasto['Descrição'] || '';
    inputData.value = new Date(gasto.Data).toISOString().split('T')[0];

    idEmEdicao = gasto.ID;
    btnSalvar.textContent = 'Atualizar';
  }

  async function confirmarExclusao(id) {
    if (!confirm('Excluir este gasto?')) return;
    try {
      await apiPost('gastos-rotineiros', 'excluir', { id: id });
      renderHistorico();
    } catch (erro) {
      alert('Não foi possível excluir: ' + erro.message);
    }
  }

  async function renderHistorico() {
    historicoCarregando.hidden = false;
    historicoVazio.hidden = true;
    listaHistorico.innerHTML = '';

    try {
      const gastos = await apiGet('gastos-rotineiros', { mes: filtroMes.value });
      gastos.sort((a, b) => new Date(b.Data) - new Date(a.Data) || b.ID - a.ID);

      gastos.forEach((gasto) => {
        const li = document.createElement('li');

        const linha1 = document.createElement('div');
        linha1.className = 'historico-linha1';
        const valorSpan = document.createElement('strong');
        valorSpan.textContent = formatarValor(gasto.Valor);
        const dataSpan = document.createElement('span');
        dataSpan.textContent = formatarData(gasto.Data);
        linha1.append(valorSpan, dataSpan);

        const linha2 = document.createElement('div');
        linha2.className = 'historico-linha2';
        linha2.textContent = gasto['Descrição'] || '';

        const acoes = document.createElement('div');
        acoes.className = 'historico-acoes';

        const btnEditar = document.createElement('button');
        btnEditar.type = 'button';
        btnEditar.textContent = 'Editar';
        btnEditar.addEventListener('click', () => entrarEmEdicao(gasto));

        const btnExcluir = document.createElement('button');
        btnExcluir.type = 'button';
        btnExcluir.className = 'btn-excluir';
        btnExcluir.textContent = 'Excluir';
        btnExcluir.addEventListener('click', () => confirmarExclusao(gasto.ID));

        acoes.append(btnEditar, btnExcluir);
        li.append(linha1, linha2, acoes);
        listaHistorico.appendChild(li);
      });

      historicoVazio.hidden = gastos.length > 0;
    } catch (erro) {
      historicoVazio.textContent = 'Não foi possível carregar: ' + erro.message;
      historicoVazio.hidden = false;
    } finally {
      historicoCarregando.hidden = true;
    }
  }

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const alvo = button.dataset.tab;

      tabButtons.forEach((b) => b.setAttribute('aria-selected', b === button ? 'true' : 'false'));
      Object.entries(tabPanels).forEach(([nome, painel]) => {
        painel.hidden = nome !== alvo;
      });

      if (alvo === 'lancar') {
        idEmEdicao = null;
        btnSalvar.textContent = textoBtnSalvar;
      } else if (alvo === 'historico') {
        renderHistorico();
      }
    });
  });

  filtroMes.addEventListener('change', renderHistorico);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    gastoErro.hidden = true;
    btnSalvar.disabled = true;

    const emEdicao = idEmEdicao !== null;
    const dados = {
      valor: parseFloat(document.getElementById('valor').value),
      categoriaId: Number(selectCategoria.value),
      meioPagamentoId: Number(selectMeioPagamento.value),
      pessoaId: Number(selectPessoa.value),
      descricao: document.getElementById('descricao').value || '',
      data: inputData.value,
    };

    try {
      if (emEdicao) {
        await apiPost('gastos-rotineiros', 'atualizar', { id: idEmEdicao, dados: dados });
      } else {
        await apiPost('gastos-rotineiros', 'criar', { dados: dados });
      }

      idEmEdicao = null;
      form.reset();
      preencherDataHoje();
      selectPessoa.value = window.pessoaAtual.id;

      btnSalvar.textContent = emEdicao ? 'Atualizado!' : 'Salvo!';
      setTimeout(() => {
        btnSalvar.textContent = textoBtnSalvar;
        btnSalvar.disabled = false;
      }, 1000);
    } catch (erro) {
      gastoErro.textContent = erro.message;
      gastoErro.hidden = false;
      btnSalvar.disabled = false;
    }
  });

  iniciarSessao(async (pessoa) => {
    saudacao.textContent = 'Olá, ' + pessoa.nome;

    if (pessoa.papel !== 'Admin') {
      bloqueioColaborador.hidden = false;
      areaAdmin.hidden = true;
      return;
    }

    areaAdmin.hidden = false;
    bloqueioColaborador.hidden = true;

    preencherDataHoje();
    filtroMes.value = mesAtual();

    try {
      await carregarListasDeApoio();
    } catch (erro) {
      gastoErro.textContent = 'Não foi possível carregar categorias/meios de pagamento: ' + erro.message;
      gastoErro.hidden = false;
    }
  });
});
