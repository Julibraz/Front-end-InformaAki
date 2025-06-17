document.addEventListener('DOMContentLoaded', () => {

  const btnVoltar = document.getElementById('btn-voltar');
  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const ocorrenciaId = new URLSearchParams(window.location.search).get('id');

  //autenticação
  if (!token) {
      showNotification('Sessão expirada. Faça login novamente.', true);
      setTimeout(() => {
          window.location.href = '../index.html';
      }, 1500);
      return;
  }

  if (!ocorrenciaId) {
      showNotification('ID da ocorrência não informado.', true);
      return;
  }

  carregarDetalhes();

  btnVoltar.addEventListener('click', () => {
      window.location.href = 'ocorrencias.html';
  });

  //modal de confirmação
  document.getElementById('btn-confirmar-exclusao').addEventListener('click', () => {
      if (window.ocorrenciaParaExcluir) {
          deletarOcorrencia(window.ocorrenciaParaExcluir);
      }
      fecharModal('confirm-modal');
  });

  document.getElementById('btn-cancelar-exclusao').addEventListener('click', () => {
      fecharModal('confirm-modal');
  });

  //carrega detalhes
  async function carregarDetalhes() {
      try {
          const resposta = await fetch(`http://localhost:3000/api/ocorrencias/${ocorrenciaId}`, {
              headers: { Authorization: `Bearer ${token}` }
          });

          if (!resposta.ok) throw new Error('Erro ao carregar detalhes da ocorrência');

          const ocorrencia = await resposta.json();
          exibirDetalhes(ocorrencia);
          inicializarMapa(ocorrencia.lat, ocorrencia.lng);
          configurarAcoes(ocorrencia);
          
      } catch (erro) {
          showNotification(`Erro ao carregar detalhes: ${erro.message}`, true);
      }
  }

  //exibe detalhes
  function exibirDetalhes(ocorrencia) {
      document.getElementById('status-badge').className = `status-badge ${ocorrencia.status.toLowerCase().replace(' ', '-')}`;
      document.getElementById('status-badge').textContent = ocorrencia.status;
      document.getElementById('ocorrencia-tipo').textContent = ocorrencia.tipo;
      document.getElementById('ocorrencia-data').textContent = `Registrada em: ${new Date(ocorrencia.data_registro).toLocaleString()}`;
      document.getElementById('ocorrencia-id').textContent = `ID: ${ocorrencia.id}`;
      document.getElementById('ocorrencia-usuario').textContent = ocorrencia.usuario_nome || 'Usuário anônimo';
      document.getElementById('ocorrencia-descricao').textContent = ocorrencia.descricao;

      buscarEndereco(ocorrencia.lat, ocorrencia.lng)
          .then(endereco => {
              document.getElementById('ocorrencia-endereco').textContent = endereco;
          });

      //Carrega a foto se existir
      const fotoContainer = document.getElementById('foto-container');
      if (ocorrencia.foto_url) {
          fotoContainer.innerHTML = `
              <img src="http://localhost:3000${ocorrencia.foto_url}" 
                   alt="Imagem da ocorrência" 
                   class="foto-ocorrencia">
          `;
      } else {
          document.getElementById('foto-section').style.display = 'none';
      }
  }

  //inicializa o mapa
  function inicializarMapa(lat, lng) {
      const map = L.map('map').setView([lat, lng], 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);
      
      L.marker([lat, lng]).addTo(map)
          .bindPopup('Local da ocorrência')
          .openPopup();
  }

  //configurar ações 
  function configurarAcoes(ocorrencia) {
      const acoesContainer = document.getElementById('acoes');
      const ehDono = Number(usuario.id) === Number(ocorrencia.usuario_id);
      const ehAdmin = usuario.tipo_usuario && usuario.tipo_usuario.toLowerCase() === 'admin';

      let html = '';

      if (ehDono) {
          html += `
              <button class="action-btn primary" onclick="editarOcorrencia(${ocorrencia.id})">
                  <i class="fas fa-edit"></i> Editar
              </button>
              <button class="action-btn danger" onclick="confirmarExclusao(${ocorrencia.id})">
                  <i class="fas fa-trash-alt"></i> Excluir
              </button>
          `;
      }

      if (ehAdmin) {
          html += `
              <button class="action-btn warning" onclick="abrirModalStatus(${ocorrencia.id}, '${ocorrencia.status}')">
                  <i class="fas fa-sync-alt"></i> Alterar Status
              </button>
          `;
      }

      acoesContainer.innerHTML = html || '<p class="no-actions">Nenhuma ação disponível para este usuário.</p>';
  }
});

//Funçoes globais
function abrirModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function fecharModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
  window.ocorrenciaParaExcluir = null;
}

function confirmarExclusao(id) {
  window.ocorrenciaParaExcluir = id;
  abrirModal('confirm-modal');
}

async function buscarEndereco(lat, lng) {
  try {
      const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': 'pt-BR' } }
      );
      
      if (!response.ok) throw new Error('Erro ao buscar endereço');
      const data = await response.json();
      return data.display_name || 'Endereço não encontrado';
  } catch (erro) {
      console.error('Erro ao buscar endereço:', erro);
      return 'Endereço não disponível';
  }
}

//mostra notificação
function showNotification(message, isError = false) {
  const notificationContainer = document.getElementById('notification');
  
  //cria elemento de notificação
  const notification = document.createElement('div');
  notification.className = `notification ${isError ? 'error' : 'success'}`;
  
  //add icone conforme o tipo
  const iconClass = isError ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
  notification.innerHTML = `
      <i class="${iconClass}"></i>
      <span>${message}</span>
  `;
  
  notificationContainer.appendChild(notification);
  
  setTimeout(() => {
      notification.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => {
          notification.remove();
      }, 300);
  }, 3000);
}

//funçes de ação
function editarOcorrencia(id) {
  window.location.href = `editar.html?id=${id}`;
}

async function deletarOcorrencia(id) {
  try {
      const response = await fetch(`http://localhost:3000/api/ocorrencias/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) throw new Error('Erro ao excluir ocorrência');
      
      showNotification('Ocorrência excluída com sucesso!', false);
      setTimeout(() => {
          window.location.href = 'ocorrencias.html';
      }, 1500);
  } catch (erro) {
      showNotification(`Erro: ${erro.message}`, true);
  }
}

function abrirModalStatus(id, statusAtual) {
  const modal = document.getElementById('modal-status');
  const select = document.getElementById('select-status');
  const btnConfirmar = document.getElementById('btn-confirmar');
  const btnCancelar = document.getElementById('btn-cancelar');
  const closeModal = document.querySelector('.close-modal');

  select.value = statusAtual;
  modal.classList.add('active');

  function fecharModalStatus() {
      modal.classList.remove('active');
      btnConfirmar.onclick = null;
      btnCancelar.onclick = null;
      closeModal.onclick = null;
  }

  function confirmar() {
      const novoStatus = select.value;
      if (novoStatus !== statusAtual) {
          atualizarStatus(id, novoStatus);
      }
      fecharModalStatus();
  }

  btnConfirmar.onclick = confirmar;
  btnCancelar.onclick = fecharModalStatus;
  closeModal.onclick = fecharModalStatus;
}

async function atualizarStatus(id, novoStatus) {
  try {
      const response = await fetch(`http://localhost:3000/api/ocorrencias/${id}`, {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ status: novoStatus })
      });

      if (!response.ok) throw new Error('Erro ao atualizar status');
      
      showNotification('Status atualizado com sucesso!', false);
      setTimeout(() => location.reload(), 1500);
  } catch (erro) {
      showNotification(`Erro: ${erro.message}`, true);
  }
}