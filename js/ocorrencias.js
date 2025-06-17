document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('ocorrencias-container');
  const logoutBtn = document.getElementById('logout-btn');
  const btnTodas = document.getElementById('btn-todas');
  const btnMinhas = document.getElementById('btn-minhas');
  const btnCadastrar = document.getElementById('btn-cadastrar');
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const prevPageBtn = document.getElementById('prev-page');
  const nextPageBtn = document.getElementById('next-page');
  const pageInfo = document.getElementById('page-info');
  const userNameElement = document.getElementById('user-name');
  const statusTotal = document.getElementById('status-total');
  const statusAberto = document.getElementById('status-aberto');
  const statusAndamento = document.getElementById('status-andamento');
  const statusResolvido = document.getElementById('status-resolvido');
  let currentStatusFilter = null;
  
  //resumo de status
  const totalCount = document.getElementById('total-count');
  const abertoCount = document.getElementById('aberto-count');
  const andamentoCount = document.getElementById('andamento-count');
  const resolvidoCount = document.getElementById('resolvido-count');

  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  let currentPage = 1;
  const itemsPerPage = 6;
  let allOcorrencias = [];
  let filteredOcorrencias = [];
  let showOnlyUserOcorrencias = false;

  if (!token) {
      showNotification('Sessão expirada. Faça login novamente.', true);
      setTimeout(() => {
          window.location.href = '../index.html';
      }, 1500);
      return;
  }

  //exibe o nome do usuario
  if (usuario && usuario.nome) {
      userNameElement.textContent = `Olá, ${usuario.nome.split(' ')[0]}`;
  }

  //mostrar notificações
  function showNotification(message, isError = false) {
      const notification = document.getElementById('notification');
      notification.innerHTML = `
          <div class="notification ${isError ? 'error' : 'success'}">
              <div class="notification-content">
                  <span>${message}</span>
              </div>
          </div>
      `;
      notification.style.display = 'block';
      
      setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 300);
      }, 3000);
  }

  //limpa container e exibir mensagem
  function exibirMensagem(msg) {
      container.innerHTML = `
          <div class="empty-state">
              <i class="fas fa-inbox"></i>
              <p>${msg}</p>
          </div>
      `;
  }

  //função para atualizar o resumo de status
function updateStatusSummary(ocorrencias) {
  totalCount.textContent = ocorrencias.length;
  abertoCount.textContent = ocorrencias.filter(o => o.status === 'Aberta').length;
  andamentoCount.textContent = ocorrencias.filter(o => o.status === 'Em andamento').length;
  resolvidoCount.textContent = ocorrencias.filter(o => o.status === 'Resolvida').length;
}

//função para renderizar ocorrências no container
function renderizarOcorrencias(ocorrencias) {
  container.innerHTML = '';
  
  if (ocorrencias.length === 0) {
      exibirMensagem('Nenhuma ocorrência encontrada.');
      return;
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOcorrencias = ocorrencias.slice(startIndex, startIndex + itemsPerPage);

  paginatedOcorrencias.forEach(ocorrencia => {
      const card = document.createElement('div');

      const statusClass = ocorrencia.status.replace(/\s+/g, '-');
      card.className = `ocorrencia-card ${statusClass}`;
      
      const dataRegistro = new Date(ocorrencia.data_registro);
      const dataFormatada = dataRegistro.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
      });

      card.innerHTML = `
          <div class="card-header">
              <h3>${ocorrencia.tipo}</h3>
              <span class="status-badge ${statusClass}">${ocorrencia.status}</span>
          </div>
          <div class="card-body">
              <div class="card-meta">
                  <span><i class="fas fa-user"></i> ${ocorrencia.nome || 'Anônimo'}</span>
                  <span><i class="fas fa-calendar-alt"></i> ${dataFormatada}</span>
              </div>
              <div class="card-description">
                  <p>${ocorrencia.descricao}</p>
              </div>
              ${ocorrencia.foto_url ? `
                  <img src="http://localhost:3000/uploads/${ocorrencia.foto_url}" alt="Imagem da ocorrência" class="foto-ocorrencia">
              ` : ''}
          </div>
          <div class="card-footer">
              <button class="detalhes-btn" data-id="${ocorrencia.id}">
                  <i class="fas fa-eye"></i> Ver Detalhes
              </button>
          </div>
      `;
      container.appendChild(card);
  });

  //atualizar controles de paginação
  pageInfo.textContent = `Página ${currentPage} de ${Math.ceil(ocorrencias.length / itemsPerPage)}`;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === Math.ceil(ocorrencias.length / itemsPerPage);
}

  //busca ocorrências
  async function buscarOcorrencias() {
      try {
          const resposta = await fetch('http://localhost:3000/api/ocorrencias', {
              headers: {
                  'Authorization': `Bearer ${token}`
              }
          });

          if (!resposta.ok) throw new Error('Erro ao carregar ocorrências');

          allOcorrencias = await resposta.json();
          aplicarFiltros();
          updateStatusSummary(allOcorrencias); // atualiza o resumo de status
      } catch (err) {
          console.error(err);
          showNotification('Erro ao carregar ocorrências.', true);
          exibirMensagem('Erro ao carregar ocorrências.');
      }
  }

  //aplica filtros e busca
  function aplicarFiltros() {
    let resultado = [...allOcorrencias];
  
    //filtra por usuário
    if (showOnlyUserOcorrencias) {
        resultado = resultado.filter(o => o.usuario_id === usuario.id);
    }
  
    //filtra por status
    if (currentStatusFilter) {
        resultado = resultado.filter(o => o.status === currentStatusFilter);
    }
  
    // Filtrar por busca
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        resultado = resultado.filter(o => 
            o.tipo.toLowerCase().includes(searchTerm) || 
            o.descricao.toLowerCase().includes(searchTerm) ||
            o.status.toLowerCase().includes(searchTerm)
        );
    }
  
    filteredOcorrencias = resultado;
    currentPage = 1;
    updateStatusSummary(filteredOcorrencias);
    renderizarOcorrencias(filteredOcorrencias);
  }

  function handleStatusFilter(status) {
    // Se clicar no mesmo status duas vezes, remove o filtro
    if (currentStatusFilter === status) {
        currentStatusFilter = null;
        statusTotal.classList.add('active');
        document.querySelectorAll('.status-card:not(#status-total)').forEach(card => {
            card.classList.remove('active');
        });
    } else {
        currentStatusFilter = status;
        // Atualiza a classe ativa
        document.querySelectorAll('.status-card').forEach(card => {
            card.classList.remove('active');
        });
        const statusElement = status === 'Aberta' ? statusAberto :
                            status === 'Em andamento' ? statusAndamento :
                            statusResolvido;
        statusElement.classList.add('active');
    }
    
    aplicarFiltros();
  }

  //filtra por status
  function filtrarPorStatus(status) {
    currentStatusFilter = status;
  
    document.querySelectorAll('.status-card').forEach(card => {
      card.classList.remove('active');
    });
  
    if (status) {
      document.getElementById(`status-${status.toLowerCase().replace(' ', '-')}`).classList.add('active');
    } else {
      statusTotal.classList.add('active');
    }
  
    aplicarFiltros();
  }


  //Eventos para os botões de filtro
  btnTodas.addEventListener('click', () => {
    btnTodas.classList.add('active');
    btnMinhas.classList.remove('active');
    showOnlyUserOcorrencias = false;
    aplicarFiltros();
  });

  btnMinhas.addEventListener('click', () => {
    btnMinhas.classList.add('active');
    btnTodas.classList.remove('active');
    showOnlyUserOcorrencias = true;
    aplicarFiltros();
  });

  //evento de busca
  searchBtn.addEventListener('click', aplicarFiltros);
  searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') aplicarFiltros();
  });

  //paginação
  prevPageBtn.addEventListener('click', () => {
      if (currentPage > 1) {
          currentPage--;
          renderizarOcorrencias(filteredOcorrencias);
      }
  });

  nextPageBtn.addEventListener('click', () => {
      if (currentPage < Math.ceil(filteredOcorrencias.length / itemsPerPage)) {
          currentPage++;
          renderizarOcorrencias(filteredOcorrencias);
      }
  });

  //redirecionar ao clicar no botão de detalhes
  container.addEventListener('click', (e) => {
      if (e.target.closest('.detalhes-btn')) {
          const id = e.target.closest('.detalhes-btn').getAttribute('data-id');
          window.location.href = `detalhes.html?id=${id}`;
      }
  });

  logoutBtn.addEventListener('click', () => {
      showNotification('Logout realizado com sucesso.', false);
      setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = '../index.html';
      }, 1000);
  });

  btnCadastrar.addEventListener('click', () => {
      window.location.href = '../html/cadastrar.html';
  });

  statusTotal.addEventListener('click', () => {
    currentStatusFilter = null;
    document.querySelectorAll('.status-card').forEach(card => {
        card.classList.remove('active');
    });
    statusTotal.classList.add('active');
    aplicarFiltros();
  });

  statusAberto.addEventListener('click', () => {
    handleStatusFilter('Aberta');
  });

  statusAndamento.addEventListener('click', () => {
    handleStatusFilter('Em andamento');
  });

  statusResolvido.addEventListener('click', () => {
    handleStatusFilter('Resolvida');
  });

  buscarOcorrencias();
});