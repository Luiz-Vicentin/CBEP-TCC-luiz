(() => {
  const busca = document.querySelector('#busca-obras');
  const botoes = [...document.querySelectorAll('.decada')];
  const obras = [...document.querySelectorAll('.obra-item')];
  const contagem = document.querySelector('#contagem-obras');
  const vazio = document.querySelector('#obras-vazias');
  let decada = 'todas';
  const normalizar = valor => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function filtrar() {
    const termo = normalizar(busca.value.trim());
    let total = 0;
    obras.forEach(obra => {
      const visivel = (decada === 'todas' || obra.dataset.decada === decada) && normalizar(obra.dataset.titulo).includes(termo);
      obra.hidden = !visivel;
      if (visivel) total++;
    });
    botoes.forEach(botao => {
      const ativo = botao.dataset.decada === decada;
      botao.classList.toggle('selecionada', ativo);
      botao.setAttribute('aria-pressed', String(ativo));
    });
    contagem.textContent = `${total} ${total === 1 ? 'obra' : 'obras'} · ordem de lançamento`;
    vazio.hidden = total !== 0;
  }
  busca.addEventListener('input', filtrar);
  botoes.forEach(botao => botao.addEventListener('click', () => {
    decada = botao.dataset.decada;
    filtrar();
  }));
  document.querySelector('#limpar-filtros').addEventListener('click', () => {
    busca.value = '';
    decada = 'todas';
    filtrar();
    busca.focus();
  });
  filtrar();
})();
