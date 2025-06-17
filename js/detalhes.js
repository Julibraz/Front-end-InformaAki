document.addEventListener('DOMContentLoaded', () => {
    const detalhesContainer = document.getElementById('detalhes-container');
    const btnVoltar = document.getElementById('btn-voltar');
  
    const token = localStorage.getItem('token');
    const usuario = JSON.parse(localStorage.getItem('usuario'));
  
    if (!token) {
      alert('Sessão expirada. Faça login novamente.');
      window.location.href = '../index.html';
      return;
    }
  
    function getQueryParam(param) {
      const params = new URLSearchParams(window.location.search);
      return params.get(param);
    }
  
    const ocorrenciaId = getQueryParam('id');
  
    if (!ocorrenciaId) {
      detalhesContainer.innerHTML = '<p>ID da ocorrência não informado.</p>';
      return;
    }
  
    async function buscarDetalhes() {
      try {
        const resposta = await fetch(`http://localhost:3000/api/ocorrencias/${ocorrenciaId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
  
        if (!resposta.ok) throw new Error('Erro ao carregar detalhes da ocorrência');
  
        const dados = await resposta.json();
  
        detalhesContainer.innerHTML = `
          <h2>${dados.tipo}</h2>
          <p><strong>Descrição:</strong> ${dados.descricao}</p>
          <p><strong>Status:</strong> ${dados.status}</p>
          ${dados.foto_url ? `<img src="http://localhost:3000/uploads/${dados.foto_url}" alt="Imagem da ocorrência" class="foto-ocorrencia">` : ''}
          <p><strong>Registrada em:</strong> ${new Date(dados.data_registro).toLocaleString()}</p>
          <p id="endereco"><strong>Localização:</strong> buscando endereço...</p>
          <div id="map" style="height: 300px; margin: 15px 0;"></div>
          <div id="acoes" style="margin-top: 20px;"></div>
        `;
        const enderecoEl = document.getElementById('endereco');
        const endereco = await buscarEndereco(dados.lat, dados.lng);
        enderecoEl.innerHTML = `<strong>Endereço:</strong> ${endereco}`;
  
        //Mapa com Leaflet
        const map = L.map('map').setView([dados.lat, dados.lng], 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        L.marker([dados.lat, dados.lng]).addTo(map)
          .bindPopup('Local da ocorrência')
          .openPopup();
  

        const ehDono = Number(usuario.id) === Number(dados.usuario_id);
        const ehAdmin = usuario.tipo_usuario && usuario.tipo_usuario.toLowerCase() === 'admin';

        console.log('ehDono:', ehDono, 'ehAdmin:', ehAdmin);

        let html = '';

        if (ehDono) {   
        html += `
            <button onclick="editarOcorrencia(${dados.id})">Editar</button>
            <button onclick="deletarOcorrencia(${dados.id})">Excluir</button>
        `;
        }

        if (ehAdmin) {  
          html += `
    <button onclick="editarStatus(${dados.id}, '${dados.status}')">Alterar Status</button>
          `;
        }

        if (!html) {
          html = '<p>Nenhuma ação disponível para este usuário.</p>';
        }

        console.log('HTML acoes:', html);

        acoes.innerHTML = html;
  
      } catch (erro) {
        detalhesContainer.innerHTML = `<p>Erro ao carregar detalhes: ${erro.message}</p>`;
      }
    }
  
    btnVoltar.addEventListener('click', () => {
      window.location.href = 'ocorrencias.html';
    });
  
    buscarDetalhes();
});
  
 
function editarOcorrencia(id) {
    window.location.href = `editar.html?id=${id}`;
}
  
//faz a requisição para deletar a ocorrência
function deletarOcorrencia(id) {
  showConfirm('Deseja realmente excluir esta ocorrência?', (confirmado) => {
    if (confirmado) {
      fetch(`http://localhost:3000/api/ocorrencias/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      .then(res => {
        if (!res.ok) throw new Error('Erro ao excluir ocorrência');
        showToast('Ocorrência excluída com sucesso.', 'sucesso');
        window.location.href = 'ocorrencias.html';
      })
      .catch(err => showToast('Erro: ' + err.message, 'erro'));
    }
  });
}

  
//Função para editar o status da ocorrência
function editarStatus(id, statusAtual) {
    abrirModalStatus(statusAtual, (novo) => {
      if (!novo || novo === statusAtual) return;
  
      fetch(`http://localhost:3000/api/ocorrencias/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: novo })
      })
        .then(res => {
          if (!res.ok) throw new Error('Erro ao atualizar status');
          alert('Status atualizado com sucesso.');
          location.reload();
        })
        .catch(err => alert('Erro: ' + err.message));
    });
}
  

//faz a busca do endereço da ocorrência com base na latitude e longitude
async function buscarEndereco(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    try {
    const response = await fetch(url, {
        headers: {
        'Accept-Language': 'pt-BR', 
        }
    });

    if (!response.ok) throw new Error('Erro ao buscar endereço');
    const data = await response.json();
    return data.display_name;
    } catch (erro) {
    console.error('Erro ao buscar endereço:', erro);
    return 'Endereço não encontrado';
    }
}

function abrirModalStatus(statusAtual, callback) {
    const modal = document.getElementById('modal-status');
    const select = document.getElementById('select-status');
    const btnConfirmar = document.getElementById('btn-confirmar');
    const btnCancelar = document.getElementById('btn-cancelar');
  
    select.value = statusAtual;
    modal.style.display = 'flex';
  
    function confirmar() {
      const novoStatus = select.value;
      fecharModal();
      callback(novoStatus);
    }
  
    function cancelar() {
      fecharModal();
    }
  
    function fecharModal() {
      modal.style.display = 'none';
      btnConfirmar.removeEventListener('click', confirmar);
      btnCancelar.removeEventListener('click', cancelar);
    }
  
    btnConfirmar.addEventListener('click', confirmar);
    btnCancelar.addEventListener('click', cancelar);
}


  