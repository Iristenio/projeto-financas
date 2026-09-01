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
  const lancMesFaturaInicial = document.getElementById('lanc-mesFaturaInicial');
  const lancData = document.getElementById('lanc-data');
  const lancamentoErro = document.getElementById('lancamento-erro');
  const lancamentoSucesso = document.getElementById('lancamento-sucesso');
  const rateioLista = document.getElementById('rateio-lista');
  const rateioSoma = document.getElementById('rateio-soma');
  const btnDividirIgual = document.getElementById('btn-dividir-igual');
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
  const editarLancamentoErro = document.getElementById('editar-lancamento-erro');
  const editarLancamentoSucesso = document.getElementById('editar-lancamento-sucesso');

  const formAjustarParcela = document.getElementById('form-ajustar-parcela');
  const ajustarNumeroParcela = document.getElementById('ajustar-numeroParcela');
  const ajustarNovoValor = document.getElementById('ajustar-novoValor');
  const ajustarModo = document.getElementById('ajustar-modo');
  const ajustarParcelaErro = document.getElementById('ajustar-parcela-erro');
  const ajustarParcelaSucesso = document.getElementById('ajustar-parcela-sucesso');

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
    montarRateioLista();

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
        }
      });

      await popularSelect(editarCategoria, categoriasCache, detalhe.categoriaId);
      editarDescricao.value = detalhe.descricao || '';
      const valoresIniciais = {};
      detalhe.rateio.forEach((r) => (valoresIniciais[r.pessoaId] = r.valorTotal));
      montarEditarRateioLista(valoresIniciais);

      if (!manterMensagens) {
        editarLancamentoErro.hidden = true;
        editarLancamentoSucesso.hidden = true;
        ajustarParcelaErro.hidden = true;
        ajustarParcelaSucesso.hidden = true;
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

  function montarEditarRateioLista(valoresIniciais) {
    editarRateioLista.innerHTML = '';
    pessoasParaRateio.forEach((pessoa) => {
      const linha = document.createElement('div');
      linha.className = 'rateio-linha';
      linha.dataset.pessoaId = pessoa.id;

      const label = document.createElement('label');
      label.className = 'rateio-check';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'rateio-incluir';
      const nomeSpan = document.createElement('span');
      nomeSpan.textContent = pessoa.nome;
      label.append(checkbox, nomeSpan);

      if (pessoa.tipo !== 'Membro do Domicílio') {
        const badge = document.createElement('span');
        badge.className = 'rateio-tipo-badge';
        badge.textContent = pessoa.tipo;
        label.appendChild(badge);
      }

      const inputValor = document.createElement('input');
      inputValor.type = 'number';
      inputValor.className = 'rateio-valor';
      inputValor.inputMode = 'decimal';
      inputValor.step = '0.01';
      inputValor.min = '0';
      inputValor.placeholder = '0,00';

      const valorInicial = valoresIniciais[pessoa.id];
      if (valorInicial !== undefined) {
        checkbox.checked = true;
        inputValor.value = valorInicial.toFixed(2);
      } else {
        inputValor.disabled = true;
      }

      checkbox.addEventListener('change', () => {
        inputValor.disabled = !checkbox.checked;
        if (!checkbox.checked) inputValor.value = '';
        atualizarEditarSomaRateio();
      });
      inputValor.addEventListener('input', atualizarEditarSomaRateio);

      linha.append(label, inputValor);
      editarRateioLista.appendChild(linha);
    });
    atualizarEditarSomaRateio();
  }

  function obterEditarRateioSelecionado() {
    return Array.from(editarRateioLista.querySelectorAll('.rateio-linha'))
      .filter((linha) => linha.querySelector('.rateio-incluir').checked)
      .map((linha) => ({
        pessoaId: Number(linha.dataset.pessoaId),
        valor: parseFloat(linha.querySelector('.rateio-valor').value) || 0,
      }));
  }

  function atualizarEditarSomaRateio() {
    const rateio = obterEditarRateioSelecionado();
    const soma = rateio.reduce((total, item) => total + item.valor, 0);
    editarRateioSoma.textContent = 'Soma do rateio: ' + formatarValor(soma) + ' de ' + formatarValor(detalheValorTotalAtual);
    editarRateioSoma.classList.remove('rateio-soma-ok', 'rateio-soma-erro');
    editarRateioSoma.classList.add(Math.abs(soma - detalheValorTotalAtual) < 0.01 ? 'rateio-soma-ok' : 'rateio-soma-erro');
  }

  editarBtnDividirIgual.addEventListener('click', () => {
    const selecionadas = Array.from(editarRateioLista.querySelectorAll('.rateio-linha')).filter(
      (linha) => linha.querySelector('.rateio-incluir').checked
    );
    if (selecionadas.length === 0) return;

    const partes = new Array(selecionadas.length).fill(Math.floor((detalheValorTotalAtual / selecionadas.length) * 100) / 100);
    const somaPartes = partes.reduce((a, b) => a + b, 0);
    partes[partes.length - 1] = Math.round((detalheValorTotalAtual - somaPartes + partes[partes.length - 1]) * 100) / 100;

    selecionadas.forEach((linha, index) => {
      linha.querySelector('.rateio-valor').value = partes[index].toFixed(2);
    });
    atualizarEditarSomaRateio();
  });

  formEditarLancamento.addEventListener('submit', async (event) => {
    event.preventDefault();
    editarLancamentoErro.hidden = true;
    editarLancamentoSucesso.hidden = true;

    const rateio = obterEditarRateioSelecionado();
    if (rateio.length === 0) {
      editarLancamentoErro.textContent = 'Selecione ao menos uma pessoa no rateio.';
      editarLancamentoErro.hidden = false;
      return;
    }

    try {
      await apiPost('lancamentos', 'atualizar', {
        id: lancamentoDetalheId,
        dados: { categoriaId: Number(editarCategoria.value), descricao: editarDescricao.value, rateio: rateio },
      });
      editarLancamentoSucesso.textContent = 'Alterações salvas.';
      editarLancamentoSucesso.hidden = false;
      listaLancamentosCarregada = false;
      await abrirDetalheLancamento(lancamentoDetalheId, true);
    } catch (erro) {
      editarLancamentoErro.textContent = erro.message;
      editarLancamentoErro.hidden = false;
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

  function montarRateioLista() {
    rateioLista.innerHTML = '';
    pessoasParaRateio.forEach((pessoa) => {
      const linha = document.createElement('div');
      linha.className = 'rateio-linha';
      linha.dataset.pessoaId = pessoa.id;

      const label = document.createElement('label');
      label.className = 'rateio-check';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'rateio-incluir';
      const nomeSpan = document.createElement('span');
      nomeSpan.textContent = pessoa.nome;
      label.append(checkbox, nomeSpan);

      if (pessoa.tipo !== 'Membro do Domicílio') {
        const badge = document.createElement('span');
        badge.className = 'rateio-tipo-badge';
        badge.textContent = pessoa.tipo;
        label.appendChild(badge);
      }

      const inputValor = document.createElement('input');
      inputValor.type = 'number';
      inputValor.className = 'rateio-valor';
      inputValor.inputMode = 'decimal';
      inputValor.step = '0.01';
      inputValor.min = '0';
      inputValor.placeholder = '0,00';
      inputValor.disabled = true;

      checkbox.addEventListener('change', () => {
        inputValor.disabled = !checkbox.checked;
        if (!checkbox.checked) inputValor.value = '';
        atualizarSomaRateio();
      });
      inputValor.addEventListener('input', atualizarSomaRateio);

      linha.append(label, inputValor);
      rateioLista.appendChild(linha);
    });
    atualizarSomaRateio();
  }

  function obterRateioSelecionado() {
    return Array.from(rateioLista.querySelectorAll('.rateio-linha'))
      .filter((linha) => linha.querySelector('.rateio-incluir').checked)
      .map((linha) => ({
        pessoaId: Number(linha.dataset.pessoaId),
        valor: parseFloat(linha.querySelector('.rateio-valor').value) || 0,
      }));
  }

  function atualizarSomaRateio() {
    const rateio = obterRateioSelecionado();
    const soma = rateio.reduce((total, item) => total + item.valor, 0);
    const valorTotal = parseFloat(document.getElementById('lanc-valorTotal').value) || 0;
    rateioSoma.textContent = 'Soma do rateio: ' + formatarValor(soma) + (valorTotal ? ' de ' + formatarValor(valorTotal) : '');
    rateioSoma.classList.remove('rateio-soma-ok', 'rateio-soma-erro');
    if (valorTotal > 0) {
      rateioSoma.classList.add(Math.abs(soma - valorTotal) < 0.01 ? 'rateio-soma-ok' : 'rateio-soma-erro');
    }
  }

  btnDividirIgual.addEventListener('click', () => {
    const selecionadas = Array.from(rateioLista.querySelectorAll('.rateio-linha')).filter(
      (linha) => linha.querySelector('.rateio-incluir').checked
    );
    if (selecionadas.length === 0) return;
    const valorTotal = parseFloat(document.getElementById('lanc-valorTotal').value) || 0;
    if (valorTotal <= 0) return;

    const partes = new Array(selecionadas.length).fill(Math.floor((valorTotal / selecionadas.length) * 100) / 100);
    const somaPartes = partes.reduce((a, b) => a + b, 0);
    partes[partes.length - 1] = Math.round((valorTotal - somaPartes + partes[partes.length - 1]) * 100) / 100;

    selecionadas.forEach((linha, index) => {
      linha.querySelector('.rateio-valor').value = partes[index].toFixed(2);
    });
    atualizarSomaRateio();
  });

  document.getElementById('lanc-valorTotal').addEventListener('input', atualizarSomaRateio);

  formLancamento.addEventListener('submit', async (event) => {
    event.preventDefault();
    lancamentoErro.hidden = true;
    lancamentoSucesso.hidden = true;

    const rateio = obterRateioSelecionado();
    if (rateio.length === 0) {
      lancamentoErro.textContent = 'Selecione ao menos uma pessoa no rateio.';
      lancamentoErro.hidden = false;
      return;
    }

    const dados = {
      categoriaId: Number(lancCategoria.value),
      meioPagamentoId: Number(lancMeioPagamento.value),
      descricao: document.getElementById('lanc-descricao').value,
      valorTotal: parseFloat(document.getElementById('lanc-valorTotal').value),
      qtdParcelas: Number(document.getElementById('lanc-qtdParcelas').value),
      mesFaturaInicial: lancMesFaturaInicial.value,
      parcelaReferencia: Number(document.getElementById('lanc-parcelaReferencia').value),
      data: lancData.value,
      recorrente: document.getElementById('lanc-recorrente').checked,
      rateio: rateio,
    };

    btnSalvarLancamento.disabled = true;
    try {
      await apiPost('lancamentos', 'criar', { dados: dados });

      formLancamento.reset();
      preencherDataHoje(lancData);
      lancMesFaturaInicial.value = mesAtual();
      document.getElementById('lanc-qtdParcelas').value = 1;
      document.getElementById('lanc-parcelaReferencia').value = 1;
      montarRateioLista();
      listaLancamentosCarregada = false;

      lancamentoSucesso.textContent = 'Lançamento criado com sucesso.';
      lancamentoSucesso.hidden = false;
    } catch (erro) {
      lancamentoErro.textContent = erro.message;
      lancamentoErro.hidden = false;
    } finally {
      btnSalvarLancamento.disabled = false;
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
