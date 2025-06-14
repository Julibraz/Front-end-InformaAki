document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('ocorrencias-container');
    const logoutBtn = document.getElementById('logout-btn');
  
    const token = localStorage.getItem('token');
  
    if (!token) {
      alert('Sessão expirada. Faça login novamente.');
      window.location.href = '/frontend/index.html';
      return;
    }
  
    //requisição para buscar ocorrências
    fetch('http://localhost:3000/api/ocorrencias', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Erro ao carregar ocorrências');
        }
        return res.json();
      })
      .then(ocorrencias => {
        if (ocorrencias.length === 0) {
          container.innerHTML = '<p>Nenhuma ocorrência registrada.</p>';
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
      })
      .catch(err => {
        console.error(err);
        container.innerHTML = '<p>Erro ao carregar ocorrências.</p>';
      });
  
    //botão de logout
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/frontend/index.html';
    });
  });
  