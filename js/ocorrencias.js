document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('ocorrencias-container');
    const logoutBtn = document.getElementById('logout-btn');
    const btnTodas = document.getElementById('btn-todas');
    const btnMinhas = document.getElementById('btn-minhas');
  
    const token = localStorage.getItem('token');
    const usuario = JSON.parse(localStorage.getItem('usuario'));
  
    if (!token) {
      alert('Sessão expirada. Faça login novamente.');
      window.location.href = '../index.html';
      return;
    }
  
    // Função para limpar container e exibir mensagem
    function exibirMensagem(msg) {
      container.innerHTML = `<p>${msg}</p>`;
    }
  
    // Função para renderizar ocorrências no container
    function renderizarOcorrencias(ocorrencias) {
      container.innerHTML = '';
      if (ocorrencias.length === 0) {
        exibirMensagem('Nenhuma ocorrência registrada.');
        return;
      }
  
      ocorrencias.forEach(ocorrencia => {
        const card = document.createElement('div');
        card.className = 'ocorrencia-card';
        card.innerHTML = `
          <h3>${ocorrencia.tipo}</h3>
          <p><strong>Descrição:</strong> ${ocorrencia.descricao}</p>
          <p><strong>Status:</strong> ${ocorrencia.status}</p>
          ${ocorrencia.foto_url ? `<img src="http://localhost:3000/uploads/${ocorrencia.foto_url}" alt="Imagem da ocorrência" class="foto-ocorrencia">` : ''}
          <p><strong>Registrada em:</strong> ${new Date(ocorrencia.data_registro).toLocaleString()}</p>
          <button class="detalhes-btn" data-id="${ocorrencia.id}">Ver Detalhes</button>
        `;
        container.appendChild(card);
      });
    }
  
    // Função para buscar ocorrências
    async function buscarOcorrencias(minhas = false) {
      try {
        const resposta = await fetch('http://localhost:3000/api/ocorrencias', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
  
        if (!resposta.ok) throw new Error('Erro ao carregar ocorrências');
  
        let ocorrencias = await resposta.json();
  
        if (minhas) {
          ocorrencias = ocorrencias.filter(o => o.usuario_id === usuario.id);
        }
  
        renderizarOcorrencias(ocorrencias);
      } catch (err) {
        console.error(err);
        exibirMensagem('Erro ao carregar ocorrências.');
      }
    }
  
    buscarOcorrencias();

    //redireciona ao clicar no botão de detalhes
    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('detalhes-btn')) {
          const id = e.target.getAttribute('data-id');
          window.location.href = `detalhes.html?id=${id}`;
        }
      });
  
    //eventos para os botões de filtro
    btnTodas.addEventListener('click', () => {
      btnTodas.classList.add('active');
      btnMinhas.classList.remove('active');
      buscarOcorrencias(false);
    });
  
    btnMinhas.addEventListener('click', () => {
      btnMinhas.classList.add('active');
      btnTodas.classList.remove('active');
      buscarOcorrencias(true);
    });
  
    //logout
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '../index.html';
    });

});
  