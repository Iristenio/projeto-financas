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

  const containerPrincipal = document.querySelector('main.container');
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanels = {
    lancar: document.getElementById('tab-lancar'),
    historico: document.getElementById('tab-historico'),
    lancamentos: document.getElementById('tab-lancamentos'),
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

  const formLancamento = document.getElementById('form-lancamento');
  const lancCategoria = document.getElementById('lanc-categoria');
  const lancMeioPagamento = document.getElementById('lanc-meioPagamento');
  const lancValorTotal = document.getElementById('lanc-valorTotal');
  const lancValorParcela = document.getElementById('lanc-valorParcela');
  const lancQtdParcelas = document.getElementById('lanc-qtdParcelas');
  const lancMesFaturaInicial = document.getElementById('lanc-mesFaturaInicial');
  const lancData = document.getElementById('lanc-data');
  const lancamentoErro = document.getElementById('lancamento-erro');
  const lancamentoSucesso = document.getElementById('lancamento-sucesso');
  const rateioLista = document.getElementById('rateio-lista');
  const rateioSoma = document.getElementById('rateio-soma');
  const btnDividirIgual = document.getElementById('btn-dividir-igual');
  const btnAdicionarPessoa = document.getElementById('btn-adicionar-pessoa');
  const btnSalvarLancamento = formLancamento.querySelector('.btn-salvar');
  const textoBtnSalvarLancamento = btnSalvarLancamento.textContent;

  const subtabButtons = document.querySelectorAll('.subtab-button');
  const subtabPanels = {
    nova: document.getElementById('subtab-nova'),
    lista: document.getElementById('subtab-lista'),
    detalhe: document.getElementById('subtab-detalhe'),
  };
  const listaLancamentos = document.getElementById('lista-lancamentos');
  const lancamentosVazio = document.getElementById('lancamentos-vazio');
  const lancamentosCarregando = document.getElementById('lancamentos-carregando');

  const btnVoltarLista = document.getElementById('btn-voltar-lista');
  const detalheTitulo = document.getElementById('detalhe-titulo');
  const detalheInfo = document.getElementById('detalhe-info');
  const detalheErro = document.getElementById('detalhe-erro');
  const detalheSaldoPessoas = document.getElementById('detalhe-saldo-pessoas');
  const detalheParcelas = document.getElementById('detalhe-parcelas');

  const formEditarLancamento = document.getElementById('form-editar-lancamento');
  const editarCategoria = document.getElementById('editar-categoria');
  const editarDescricao = document.getElementById('editar-descricao');
  const editarRateioLista = document.getElementById('editar-rateio-lista');
  const editarRateioSoma = document.getElementById('editar-rateio-soma');
  const editarBtnDividirIgual = document.getElementById('editar-btn-dividir-igual');
  const editarBtnAdicionarPessoa = document.getElementById('editar-btn-adicionar-pessoa');
  const btnSalvarEditarLancamento = document.getElementById('btn-salvar-editar-lancamento');
  const editarLancamentoErro = document.getElementById('editar-lancamento-erro');
  const editarLancamentoSucesso = document.getElementById('editar-lancamento-sucesso');

  const formAjustarParcela = document.getElementById('form-ajustar-parcela');
  const ajustarNumeroParcela = document.getElementById('ajustar-numeroParcela');
  const ajustarNovoValor = document.getElementById('ajustar-novoValor');
  const ajustarModo = document.getElementById('ajustar-modo');
  const ajustarParcelaErro = document.getElementById('ajustar-parcela-erro');
  const ajustarParcelaSucesso = document.getElementById('ajustar-parcela-sucesso');

  const formAntecipar = document.getElementById('form-antecipar-parcela');
  const anteciparParcelasLista = document.getElementById('antecipar-parcelas-lista');
  const anteciparDataPagamento = document.getElementById('antecipar-dataPagamento');
  const anteciparObservacao = document.getElementById('antecipar-observacao');
  const anteciparParcelaErro = document.getElementById('antecipar-parcela-erro');
  const anteciparParcelaSucesso = document.getElementById('antecipar-parcela-sucesso');

  const btnExcluirAbertas = document.getElementById('btn-excluir-abertas');
  const btnExcluirTudo = document.getElementById('btn-excluir-tudo');
  const excluirLancamentoErro = document.getElementById('excluir-lancamento-erro');

  let listasLancamentoCarregadas = false;
  let listaLancamentosCarregada = false;
  let pessoasParaRateio = [];
  let categoriasCache = [];
  let mapaCategorias = {};
  let mapaMeiosPagamento = {};
  let mapaPessoas = {};
  let lancamentoDetalheId = null;
  let detalheValorTotalAtual = 0;
  let detalheQtdParcelasAtual = 1;

  let idEmEdicao = null;

  function mesAtual() {
    const hoje = new Date();
    return hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0');
  }

  function preencherDataHoje(input) {
    const hoje = new Date();
    const offset = hoje.getTimezoneOffset();
    const local = new Date(hoje.getTime() - offset * 60 * 1000);
    (input || inputData).value = local.toISOString().split('T')[0];
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

  function arredondar2(valor) {
    return Math.round(valor * 100) / 100;
  }

  /**
   * Gerencia uma tabela de rateio (linha por pessoa: select +
   * valor da parcela editável + total somente leitura + remover),
   * reaproveitada tanto no Nova Conta quanto no Editar Lançamento
   * — mesmo padrão do sistema antigo (Form_NovaConta/Form_EditarLancamento).
   */
  function criarGerenciadorRateio(config) {
    function pessoasOptionsHtml(pessoaIdSelecionado) {
      return config
        .getPessoas()
        .map((p) => {
          const rotulo = p.nome + (p.tipo !== 'Membro do Domicílio' ? ' (' + p.tipo + ')' : '');
          const selecionado = pessoaIdSelecionado != null && Number(pessoaIdSelecionado) === Number(p.id) ? ' selected' : '';
          return '<option value="' + p.id + '"' + selecionado + '>' + rotulo + '</option>';
        })
        .join('');
    }

    function criarLinha(pessoaId, valorParcelaInicial) {
      const linha = document.createElement('div');
      linha.className = 'linha-rateio';
      linha.innerHTML =
        '<select class="pessoaSelect">' +
        pessoasOptionsHtml(pessoaId) +
        '</select>' +
        '<input type="number" class="valorParcelaRateio" step="0.01" min="0" placeholder="0,00" value="' +
        (valorParcelaInicial != null ? Number(valorParcelaInicial).toFixed(2) : '') +
        '">' +
        '<span class="valorTotalRateio">R$ 0,00</span>' +
        '<button type="button" class="btnRemoverPessoa">×</button>';
      config.container.appendChild(linha);

      linha.querySelector('.btnRemoverPessoa').addEventListener('click', () => {
        if (config.container.querySelectorAll('.linha-rateio').length > 1) {
          linha.remove();
          atualizarResumo();
        }
      });
      linha.querySelector('.valorParcelaRateio').addEventListener('input', atualizarResumo);
    }

    function obterRateio() {
      const qtdParcelas = config.getQtdParcelas();
      return Array.from(config.container.querySelectorAll('.linha-rateio')).map((linha) => {
        const valorParcela = parseFloat(linha.querySelector('.valorParcelaRateio').value) || 0;
        return { pessoaId: Number(linha.querySelector('.pessoaSelect').value), valor: arredondar2(valorParcela * qtdParcelas) };
      });
    }

    function atualizarResumo() {
      const valorTotal = config.getValorTotal();
      const qtdParcelas = config.getQtdParcelas();

      let somaTotais = 0;
      config.container.querySelectorAll('.linha-rateio').forEach((linha) => {
        const valorParcela = parseFloat(linha.querySelector('.valorParcelaRateio').value) || 0;
        const totalPessoa = valorParcela * qtdParcelas;
        somaTotais += totalPessoa;
        linha.querySelector('.valorTotalRateio').textContent = formatarValor(totalPessoa);
      });

      const tolerancia = 0.01 * qtdParcelas;
      const bate = Math.abs(somaTotais - valorTotal) <= tolerancia && valorTotal > 0;

      config.somaEl.textContent = 'Soma do rateio: ' + formatarValor(somaTotais) + ' de ' + formatarValor(valorTotal);
      config.somaEl.classList.remove('rateio-soma-ok', 'rateio-soma-erro');
      config.somaEl.classList.add(bate ? 'rateio-soma-ok' : 'rateio-soma-erro');
      if (config.btnSalvar) config.btnSalvar.disabled = !bate;
      return bate;
    }

    function dividirIgualmente() {
      const valorTotal = config.getValorTotal();
      const qtdParcelas = config.getQtdParcelas();
      const valorParcelaGlobal = qtdParcelas > 0 ? valorTotal / qtdParcelas : 0;
      const linhas = config.container.querySelectorAll('.linha-rateio');
      const qtdPessoas = linhas.length;
      if (qtdPessoas === 0 || valorParcelaGlobal <= 0) return;

      const base = Math.floor((valorParcelaGlobal / qtdPessoas) * 100) / 100;
      const somaParcial = base * (qtdPessoas - 1);
      const ultimo = Math.round((valorParcelaGlobal - somaParcial) * 100) / 100;

      linhas.forEach((linha, index) => {
        linha.querySelector('.valorParcelaRateio').value = (index === qtdPessoas - 1 ? ultimo : base).toFixed(2);
      });
      atualizarResumo();
    }

    function limparValores() {
      config.container.querySelectorAll('.valorParcelaRateio').forEach((input) => {
        input.value = '';
      });
    }

    function limparTudo() {
      config.container.innerHTML = '';
    }

    return { criarLinha, obterRateio, atualizarResumo, dividirIgualmente, limparValores, limparTudo };
  }

  const gerenciadorRateioNova = criarGerenciadorRateio({
    container: rateioLista,
    somaEl: rateioSoma,
    getValorTotal: () => parseFloat(lancValorTotal.value) || 0,
    getQtdParcelas: () => Number(lancQtdParcelas.value) || 1,
    getPessoas: () => pessoasParaRateio,
    btnSalvar: btnSalvarLancamento,
  });

  const gerenciadorRateioEditar = criarGerenciadorRateio({
    container: editarRateioLista,
    somaEl: editarRateioSoma,
    getValorTotal: () => detalheValorTotalAtual,
    getQtdParcelas: () => detalheQtdParcelasAtual,
    getPessoas: () => pessoasParaRateio,
    btnSalvar: btnSalvarEditarLancamento,
  });

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

  async function carregarListasLancamento() {
    const [categorias, meiosPagamento, pessoas] = await Promise.all([
      apiGet('categorias'),
      apiGet('meios-pagamento'),
      apiGet('pessoas-todas'),
    ]);
    await popularSelect(lancCategoria, categorias);
    await popularSelect(
      lancMeioPagamento,
      meiosPagamento.filter((m) => m.tipo !== 'Pronto Pagamento')
    );
    pessoasParaRateio = pessoas;
    gerenciadorRateioNova.limparTudo();
    gerenciadorRateioNova.criarLinha(null, null);
    gerenciadorRateioNova.atualizarResumo();

    categoriasCache = categorias;
    mapaCategorias = {};
    categorias.forEach((c) => (mapaCategorias[c.id] = c.nome));
    mapaMeiosPagamento = {};
    meiosPagamento.forEach((m) => (mapaMeiosPagamento[m.id] = m.nome));
    mapaPessoas = {};
    pessoas.forEach((p) => (mapaPessoas[p.id] = p.nome));
  }

  function formatarMesAno(dataIso) {
    const d = new Date(dataIso);
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    return meses[d.getUTCMonth()] + '/' + d.getUTCFullYear();
  }

  async function renderListaLancamentos() {
    lancamentosCarregando.hidden = false;
    lancamentosVazio.hidden = true;
    listaLancamentos.innerHTML = '';

    try {
      const lancamentos = await apiGet('lancamentos');
      lancamentos.sort((a, b) => new Date(b.data) - new Date(a.data) || b.id - a.id);

      lancamentos.forEach((lanc) => {
        const li = document.createElement('li');
        li.className = 'lancamento-card';

        const linha1 = document.createElement('div');
        linha1.className = 'lancamento-linha1';
        const descSpan = document.createElement('strong');
        descSpan.textContent = lanc.descricao || '(sem descrição)';
        const valorSpan = document.createElement('span');
        valorSpan.textContent = formatarValor(lanc.valorTotal);
        linha1.append(descSpan, valorSpan);

        const linha2 = document.createElement('div');
        linha2.className = 'lancamento-linha2';
        const categoriaMeio = document.createElement('span');
        categoriaMeio.textContent = (mapaCategorias[lanc.categoriaId] || '?') + ' · ' + (mapaMeiosPagamento[lanc.meioPagamentoId] || '?');
        linha2.appendChild(categoriaMeio);
        if (lanc.recorrente) {
          const badge = document.createElement('span');
          badge.className = 'badge-recorrente';
          badge.textContent = 'Recorrente';
          linha2.appendChild(badge);
        }

        const progresso = document.createElement('div');
        progresso.className = 'lancamento-progresso';
        progresso.textContent = lanc.parcelasPagas + '/' + lanc.parcelasTotal + ' parcelas pagas · ' + formatarValor(lanc.valorPago) + ' pago';

        const saldo = document.createElement('div');
        const quitado = lanc.saldoDevedor <= 0;
        saldo.className = 'lancamento-saldo' + (quitado ? ' quitado' : '');
        saldo.textContent = quitado ? 'Quitado' : 'Saldo devedor: ' + formatarValor(lanc.saldoDevedor);

        li.append(linha1, linha2, progresso, saldo);

        if (lanc.proximaParcela) {
          const proxima = document.createElement('div');
          proxima.className = 'lancamento-proxima';
          proxima.textContent =
            'Próxima parcela: Nº' + lanc.proximaParcela.numero + ' · ' + formatarValor(lanc.proximaParcela.valor) + ' · ' + formatarMesAno(lanc.proximaParcela.mesVencimento);
          li.appendChild(proxima);
        }

        li.addEventListener('click', () => abrirDetalheLancamento(lanc.id));
        listaLancamentos.appendChild(li);
      });

      lancamentosVazio.hidden = lancamentos.length > 0;
    } catch (erro) {
      lancamentosVazio.textContent = 'Não foi possível carregar: ' + erro.message;
      lancamentosVazio.hidden = false;
    } finally {
      lancamentosCarregando.hidden = true;
    }
  }

  subtabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const alvo = button.dataset.subtab;
      subtabButtons.forEach((b) => b.setAttribute('aria-selected', b === button ? 'true' : 'false'));
      Object.entries(subtabPanels).forEach(([nome, painel]) => {
        painel.hidden = nome !== alvo;
      });
      if (alvo === 'lista' && !listaLancamentosCarregada) {
        listaLancamentosCarregada = true;
        renderListaLancamentos();
      }
    });
  });

  function mostrarSubtab(nome) {
    Object.entries(subtabPanels).forEach(([n, painel]) => {
      painel.hidden = n !== nome;
    });
    subtabButtons.forEach((b) => b.setAttribute('aria-selected', b.dataset.subtab === nome ? 'true' : 'false'));
  }

  async function abrirDetalheLancamento(id, manterMensagens) {
    lancamentoDetalheId = id;
    mostrarSubtab('detalhe');
    detalheErro.hidden = true;
    detalheSaldoPessoas.innerHTML = '';
    detalheParcelas.innerHTML = '<li>Carregando...</li>';

    try {
      const detalhe = await apiGet('lancamentos', { id: id });
      detalheValorTotalAtual = detalhe.valorTotal;

      detalheTitulo.textContent = detalhe.descricao || '(sem descrição)';
      detalheInfo.textContent =
        (mapaCategorias[detalhe.categoriaId] || '?') + ' · ' + (mapaMeiosPagamento[detalhe.meioPagamentoId] || '?') + ' · ' + formatarValor(detalhe.valorTotal) + (detalhe.recorrente ? ' · Recorrente' : '');

      detalheSaldoPessoas.innerHTML = '';
      detalhe.rateio.forEach((r) => {
        const li = document.createElement('li');
        const nome = document.createElement('span');
        nome.textContent = mapaPessoas[r.pessoaId] || 'Pessoa #' + r.pessoaId;
        const valores = document.createElement('span');
        valores.textContent = formatarValor(r.valorTotal) + ' · pago ' + formatarValor(r.valorPago) + ' · deve ' + formatarValor(r.saldoDevedor);
        li.append(nome, valores);
        detalheSaldoPessoas.appendChild(li);
      });

      detalheParcelas.innerHTML = '';
      ajustarNumeroParcela.innerHTML = '';
      anteciparParcelasLista.innerHTML = '';
      detalhe.parcelas.forEach((p) => {
        const li = document.createElement('li');
        const info = document.createElement('span');
        info.textContent = 'Nº' + p['Nº Parcela'] + ' · ' + formatarMesAno(p['Mês Vencimento']) + ' · ' + formatarValor(p.Valor);
        const status = document.createElement('span');
        status.className = 'parcela-status' + (p.Status === 'Pago' ? ' parcela-status-pago' : '');
        status.textContent = p.Status === 'Pago' ? 'Pago em ' + formatarData(p['Data Pagamento']) : 'Aberto';
        li.append(info, status);
        detalheParcelas.appendChild(li);

        if (p.Status === 'Aberto') {
          const option = document.createElement('option');
          option.value = p['Nº Parcela'];
          option.textContent = 'Nº' + p['Nº Parcela'] + ' · ' + formatarMesAno(p['Mês Vencimento']) + ' · ' + formatarValor(p.Valor);
          ajustarNumeroParcela.appendChild(option);

          const labelCheck = document.createElement('label');
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.value = p.ID;
          const texto = document.createElement('span');
          texto.textContent = 'Nº' + p['Nº Parcela'] + ' · ' + formatarMesAno(p['Mês Vencimento']) + ' · ' + formatarValor(p.Valor);
          labelCheck.append(checkbox, texto);
          anteciparParcelasLista.appendChild(labelCheck);
        }
      });

      await popularSelect(editarCategoria, categoriasCache, detalhe.categoriaId);
      editarDescricao.value = detalhe.descricao || '';
      detalheQtdParcelasAtual = detalhe.qtdParcelas;
      gerenciadorRateioEditar.limparTudo();
      detalhe.rateio.forEach((r) => gerenciadorRateioEditar.criarLinha(r.pessoaId, r.valorTotal / detalhe.qtdParcelas));
      gerenciadorRateioEditar.atualizarResumo();

      preencherDataHoje(anteciparDataPagamento);

      if (!manterMensagens) {
        editarLancamentoErro.hidden = true;
        editarLancamentoSucesso.hidden = true;
        ajustarParcelaErro.hidden = true;
        ajustarParcelaSucesso.hidden = true;
        anteciparParcelaErro.hidden = true;
        anteciparParcelaSucesso.hidden = true;
        excluirLancamentoErro.hidden = true;
      }
    } catch (erro) {
      detalheErro.textContent = 'Não foi possível carregar o lançamento: ' + erro.message;
      detalheErro.hidden = false;
    }
  }

  btnVoltarLista.addEventListener('click', () => {
    lancamentoDetalheId = null;
    listaLancamentosCarregada = false;
    mostrarSubtab('lista');
    renderListaLancamentos();
    listaLancamentosCarregada = true;
  });

  editarBtnAdicionarPessoa.addEventListener('click', () => {
    gerenciadorRateioEditar.limparValores();
    gerenciadorRateioEditar.criarLinha(null, null);
    gerenciadorRateioEditar.atualizarResumo();
  });

  editarBtnDividirIgual.addEventListener('click', () => gerenciadorRateioEditar.dividirIgualmente());

  formEditarLancamento.addEventListener('submit', async (event) => {
    event.preventDefault();
    editarLancamentoErro.hidden = true;
    editarLancamentoSucesso.hidden = true;

    try {
      await apiPost('lancamentos', 'atualizar', {
        id: lancamentoDetalheId,
        dados: { categoriaId: Number(editarCategoria.value), descricao: editarDescricao.value, rateio: gerenciadorRateioEditar.obterRateio() },
      });
      editarLancamentoSucesso.textContent = 'Alterações salvas.';
      editarLancamentoSucesso.hidden = false;
      listaLancamentosCarregada = false;
      await abrirDetalheLancamento(lancamentoDetalheId, true);
    } catch (erro) {
      editarLancamentoErro.textContent = erro.message;
      editarLancamentoErro.hidden = false;
      gerenciadorRateioEditar.atualizarResumo();
    }
  });

  formAjustarParcela.addEventListener('submit', async (event) => {
    event.preventDefault();
    ajustarParcelaErro.hidden = true;
    ajustarParcelaSucesso.hidden = true;

    try {
      await apiPost('lancamentos', 'ajustarValorParcelas', {
        id: lancamentoDetalheId,
        numeroParcela: Number(ajustarNumeroParcela.value),
        novoValor: parseFloat(ajustarNovoValor.value),
        modo: ajustarModo.value,
      });
      ajustarParcelaSucesso.textContent = 'Parcela(s) ajustada(s).';
      ajustarParcelaSucesso.hidden = false;
      ajustarNovoValor.value = '';
      listaLancamentosCarregada = false;
      await abrirDetalheLancamento(lancamentoDetalheId, true);
    } catch (erro) {
      ajustarParcelaErro.textContent = erro.message;
      ajustarParcelaErro.hidden = false;
    }
  });

  formAntecipar.addEventListener('submit', async (event) => {
    event.preventDefault();
    anteciparParcelaErro.hidden = true;
    anteciparParcelaSucesso.hidden = true;

    const parcelaIds = Array.from(anteciparParcelasLista.querySelectorAll('input[type="checkbox"]:checked')).map((c) => Number(c.value));
    if (parcelaIds.length === 0) {
      anteciparParcelaErro.textContent = 'Selecione ao menos uma parcela para antecipar.';
      anteciparParcelaErro.hidden = false;
      return;
    }

    try {
      await apiPost('parcelas', 'antecipar', {
        lancamentoId: lancamentoDetalheId,
        parcelaIds: parcelaIds,
        modoRestante: document.querySelector('input[name="anteciparModoRestante"]:checked').value,
        dataPagamento: anteciparDataPagamento.value,
        observacao: anteciparObservacao.value,
      });
      anteciparParcelaSucesso.textContent = 'Parcela(s) antecipada(s).';
      anteciparParcelaSucesso.hidden = false;
      anteciparObservacao.value = '';
      listaLancamentosCarregada = false;
      await abrirDetalheLancamento(lancamentoDetalheId, true);
    } catch (erro) {
      anteciparParcelaErro.textContent = erro.message;
      anteciparParcelaErro.hidden = false;
    }
  });

  async function excluirLancamentoAtual(modo) {
    const mensagem = modo === 'tudo' ? 'Excluir este lançamento por completo (todas as parcelas)?' : 'Excluir só as parcelas em aberto? As já pagas ficam como histórico.';
    if (!confirm(mensagem)) return;

    excluirLancamentoErro.hidden = true;
    try {
      await apiPost('lancamentos', 'excluir', { id: lancamentoDetalheId, modo: modo });
      listaLancamentosCarregada = false;
      if (modo === 'tudo') {
        lancamentoDetalheId = null;
        mostrarSubtab('lista');
        renderListaLancamentos();
        listaLancamentosCarregada = true;
      } else {
        await abrirDetalheLancamento(lancamentoDetalheId, true);
      }
    } catch (erro) {
      excluirLancamentoErro.textContent = erro.message;
      excluirLancamentoErro.hidden = false;
    }
  }

  btnExcluirAbertas.addEventListener('click', () => excluirLancamentoAtual('apenasAbertas'));
  btnExcluirTudo.addEventListener('click', () => excluirLancamentoAtual('tudo'));

  function getModoValorLancamento() {
    return document.querySelector('input[name="lancModoValor"]:checked').value;
  }

  function aplicarModoValorLancamento() {
    const modo = getModoValorLancamento();
    lancValorTotal.disabled = modo !== 'total';
    lancValorParcela.disabled = modo !== 'parcela';
  }

  // Espelha Valor Total <-> Valor da Parcela conforme o modo
  // escolhido (igual ao Nova Conta do sistema antigo), e quando só
  // há 1 pessoa no rateio, mantém a parcela dela igual à parcela
  // global — cobre o caso mais comum sem precisar tocar no rateio.
  function recalcularValoresLancamento() {
    const modo = getModoValorLancamento();
    const qtdParcelas = Number(lancQtdParcelas.value) || 1;

    if (modo === 'total') {
      const valorTotal = parseFloat(lancValorTotal.value) || 0;
      const valorParcela = valorTotal / qtdParcelas;
      lancValorParcela.value = valorParcela ? valorParcela.toFixed(2) : '';
    } else {
      const valorParcela = parseFloat(lancValorParcela.value) || 0;
      const valorTotal = valorParcela * qtdParcelas;
      lancValorTotal.value = valorTotal ? valorTotal.toFixed(2) : '';
    }

    const linhas = rateioLista.querySelectorAll('.linha-rateio');
    if (linhas.length === 1) {
      const valorParcelaGlobal = parseFloat(lancValorParcela.value) || 0;
      linhas[0].querySelector('.valorParcelaRateio').value = valorParcelaGlobal ? valorParcelaGlobal.toFixed(2) : '';
    }

    gerenciadorRateioNova.atualizarResumo();
  }

  document.querySelectorAll('input[name="lancModoValor"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      aplicarModoValorLancamento();
      recalcularValoresLancamento();
    });
  });
  lancValorTotal.addEventListener('input', () => {
    if (getModoValorLancamento() === 'total') recalcularValoresLancamento();
  });
  lancValorParcela.addEventListener('input', () => {
    if (getModoValorLancamento() === 'parcela') recalcularValoresLancamento();
  });
  lancQtdParcelas.addEventListener('input', recalcularValoresLancamento);

  btnAdicionarPessoa.addEventListener('click', () => {
    gerenciadorRateioNova.limparValores();
    gerenciadorRateioNova.criarLinha(null, null);
    gerenciadorRateioNova.atualizarResumo();
  });

  btnDividirIgual.addEventListener('click', () => gerenciadorRateioNova.dividirIgualmente());

  formLancamento.addEventListener('submit', async (event) => {
    event.preventDefault();
    lancamentoErro.hidden = true;
    lancamentoSucesso.hidden = true;

    const dados = {
      categoriaId: Number(lancCategoria.value),
      meioPagamentoId: Number(lancMeioPagamento.value),
      descricao: document.getElementById('lanc-descricao').value,
      valorTotal: parseFloat(lancValorTotal.value),
      qtdParcelas: Number(lancQtdParcelas.value),
      mesFaturaInicial: lancMesFaturaInicial.value,
      parcelaReferencia: Number(document.getElementById('lanc-parcelaReferencia').value),
      data: lancData.value,
      recorrente: document.getElementById('lanc-recorrente').checked,
      rateio: gerenciadorRateioNova.obterRateio(),
    };

    btnSalvarLancamento.disabled = true;
    try {
      await apiPost('lancamentos', 'criar', { dados: dados });

      formLancamento.reset();
      preencherDataHoje(lancData);
      lancMesFaturaInicial.value = mesAtual();
      lancQtdParcelas.value = 1;
      document.getElementById('lanc-parcelaReferencia').value = 1;
      document.querySelector('input[name="lancModoValor"][value="total"]').checked = true;
      aplicarModoValorLancamento();
      gerenciadorRateioNova.limparTudo();
      gerenciadorRateioNova.criarLinha(null, null);
      listaLancamentosCarregada = false;

      lancamentoSucesso.textContent = 'Lançamento criado com sucesso.';
      lancamentoSucesso.hidden = false;
      gerenciadorRateioNova.atualizarResumo();
    } catch (erro) {
      lancamentoErro.textContent = erro.message;
      lancamentoErro.hidden = false;
      gerenciadorRateioNova.atualizarResumo();
    }
  });

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

      containerPrincipal.classList.toggle('container-larga', alvo === 'lancamentos');

      if (alvo === 'lancar') {
        idEmEdicao = null;
        btnSalvar.textContent = textoBtnSalvar;
      } else if (alvo === 'historico') {
        renderHistorico();
      } else if (alvo === 'lancamentos' && !listasLancamentoCarregadas) {
        listasLancamentoCarregadas = true;
        preencherDataHoje(lancData);
        lancMesFaturaInicial.value = mesAtual();
        carregarListasLancamento().catch((erro) => {
          lancamentoErro.textContent = 'Não foi possível carregar categorias/meios de pagamento/pessoas: ' + erro.message;
          lancamentoErro.hidden = false;
        });
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
