document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    const form = document.getElementById('form-editar');
    const enderecoInput = document.getElementById('endereco');
    const btnBuscarEndereco = document.getElementById('btn-buscar-endereco');
    const btnUsarLocalizacao = document.getElementById('btn-usar-localizacao');
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');
    const btnVoltar = document.getElementById('btn-voltar');
    const fotoInput = document.getElementById('foto');
    const previewContainer = document.getElementById('preview-container');
    const imagemAtualContainer = document.getElementById('imagem-atual');
  
    //modal
    const modal = document.getElementById('modal-confirm');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    const closeModal = document.querySelector('.close-modal');
  
    let map, marker;
    const id = new URLSearchParams(window.location.search).get('id');
  
    if (!token || !id) {
      showModal('Acesso inválido', 'Você não tem permissão para acessar esta página.', () => {
          window.location.href = 'ocorrencias.html';
      });
      return;
    }
  
    //Iniciaa o mapa
    function initMap(lat = -15.7801, lng = -47.9292) {
      map = L.map('map').setView([lat, lng], 14);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      marker = L.marker([lat, lng], { 
          draggable: true 
      }).addTo(map)
        .bindPopup('Arraste para ajustar a localização')
        .openPopup();
      
      marker.on('dragend', function() {
          const { lat, lng } = marker.getLatLng();
          updateCoords(lat, lng);
          obterEnderecoPorCoordenadas(lat, lng);
      });

      map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          updateCoords(lat, lng);
          obterEnderecoPorCoordenadas(lat, lng);
      });
    }
  
    //Atualiza campos de coordenadas
    function updateCoords(lat, lng) {
      latitudeInput.value = lat;
      longitudeInput.value = lng;
    }

    async function obterEnderecoPorCoordenadas(lat, lon) {
      try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
          const dados = await res.json();
          
          if (dados && dados.address) {
              const address = dados.address;
              let displayName = '';
              
              if (address.road) displayName += address.road;
              if (address.house_number) displayName += `, ${address.house_number}`;
              if (!displayName && address.neighbourhood) displayName += address.neighbourhood;
              if (!displayName && address.suburb) displayName += address.suburb;
              if (address.city) displayName += `, ${address.city}`;
              
              if (displayName) {
                  enderecoInput.value = displayName;
              } else if (dados.display_name) {
                  enderecoInput.value = dados.display_name.split(',')[0];
              }
          }
      } catch (err) {
          console.error('Erro ao buscar endereço:', err);
      }
    }
  
    //busca coordenadas a partir de endereço
    async function buscarEndereco() {
      const endereco = enderecoInput.value.trim();
      if (!endereco) {
          showModal('Campo vazio', 'Por favor, digite um endereço para buscar.');
          return;
      }
      
      try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}&limit=1`);
          const dados = await res.json();
          
          if (dados.length === 0) {
              showModal('Endereço não encontrado', 'Não foi possível localizar o endereço informado. Tente novamente.');
              return;
          }
          
          const { lat, lon } = dados[0];
          map.setView([lat, lon], 16);
          marker.setLatLng([lat, lon]);
          updateCoords(lat, lon);
      } catch (err) {
          console.error('Erro na busca:', err);
          showModal('Erro', 'Ocorreu um erro ao buscar o endereço. Tente novamente.');
      }
    }
  
    //localização atual do usuário
    function usarLocalizacaoAtual() {
      if (!navigator.geolocation) {
          showModal('Geolocalização não suportada', 'Seu navegador não suporta geolocalização.');
          return;
      }
      
      showModal('Aguarde', 'Obtendo sua localização atual...');
      
      navigator.geolocation.getCurrentPosition(
          pos => {
              const { latitude, longitude } = pos.coords;
              map.setView([latitude, longitude], 16);
              marker.setLatLng([latitude, longitude]);
              updateCoords(latitude, longitude);
              obterEnderecoPorCoordenadas(latitude, longitude);
              closeModal();
          },
          err => {
              console.error('Erro ao obter localização:', err);
              showModal(
                  'Localização não disponível', 
                  'Não foi possível obter sua localização. Verifique as permissões ou digite um endereço manualmente.'
              );
          },
          { timeout: 10000 }
      );
    }
  
    //preview da imagem
    function handleImagePreview(event) {
      previewContainer.style.display = 'none';
      previewContainer.innerHTML = '';
      
      const file = event.target.files[0];
      if (!file) return;
      
      if (!file.type.match('image.*')) {
          showModal('Formato inválido', 'Por favor, selecione um arquivo de imagem.');
          fotoInput.value = '';
          return;
      }
      
      const reader = new FileReader();
      reader.onload = function(e) {
          previewContainer.style.display = 'block';
          previewContainer.innerHTML = `<img src="${e.target.result}" alt="Nova imagem">`;
      }
      reader.readAsDataURL(file);
    }
  
    //mostra modal de confirmação
    function showModal(title, message, callback = null) {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modal.style.display = 'block';

        const redirectAfter = 2000;
        let hasConfirmed = false;

        const handleConfirm = () => {
         if (hasConfirmed) return;
            hasConfirmed = true;
            modal.style.display = 'none';
            if (callback) callback();
        };

        modalConfirmBtn.onclick = handleConfirm;
        closeModal.onclick = handleConfirm;
        window.onclick = function(event) {
            if (event.target === modal) {
                handleConfirm();
            }
        };

   
        if (callback) {
            setTimeout(handleConfirm, redirectAfter);
        }
    }

  
    async function carregarOcorrencia() {
      try {
          const res = await fetch(`http://localhost:3000/api/ocorrencias/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          
          if (!res.ok) throw new Error('Erro ao carregar ocorrência');
          
          const dados = await res.json();
          
          if (usuario.id !== dados.usuario_id && usuario.tipo !== 'admin') {
              showModal('Permissão negada', 'Você não tem permissão para editar esta ocorrência.', () => {
                  window.location.href = 'ocorrencias.html';
              });
              return;
          }
          
          document.getElementById('tipo').value = dados.tipo;
          document.getElementById('descricao').value = dados.descricao;
          
          const lat = parseFloat(dados.lat);
          const lng = parseFloat(dados.lng);
          updateCoords(lat, lng);
          
          initMap(lat, lng);
          map.setView([lat, lng], 16);
          
          await obterEnderecoPorCoordenadas(lat, lng);
          
          if (dados.foto_url) {
            imagemAtualContainer.innerHTML = `<img src="http://localhost:3000${dados.foto_url}" alt="Imagem atual">`;
          } else {
              imagemAtualContainer.innerHTML = '<p>Nenhuma imagem cadastrada</p>';
          }
          
      } catch (err) {
          console.error('Erro ao carregar ocorrência:', err);
          showModal('Erro', 'Não foi possível carregar os dados da ocorrência.', () => {
              window.location.href = 'ocorrencias.html';
          });
      }
    }
  
    //formulario de edição
    async function submitForm(event) {
        event.preventDefault();
    
        const fotoInput = document.getElementById('foto');

        const formData = new FormData();
        formData.append('tipo', document.getElementById('tipo').value);
        formData.append('descricao', document.getElementById('descricao').value);
        formData.append('lat', latitudeInput.value);
        formData.append('lng', longitudeInput.value);
    
        const statusInput = document.getElementById('status');
        if (statusInput) formData.append('status', statusInput.value);
    
        //Adiciona a foto apenas se uma nova foi selecionada
        if (fotoInput.files[0]) {
            formData.append('foto', fotoInput.files[0]);
        }

        try {
            const response = await fetch(`http://localhost:3000/api/ocorrencias/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.erro || 'Erro ao atualizar');
            }

            showModal('Sucesso!', 'Ocorrência atualizada com sucesso!', () => {
                window.location.href = `detalhes.html?id=${id}`;
            });

        } catch (err) {
            console.error('Erro no frontend:', err);
            showModal('Erro', err.message || 'Erro ao atualizar ocorrência');
        }
    }


    btnBuscarEndereco.addEventListener('click', buscarEndereco);
    btnUsarLocalizacao.addEventListener('click', usarLocalizacaoAtual);
    btnVoltar.addEventListener('click', () => window.location.href = `detalhes.html?id=${id}`);
    form.addEventListener('submit', submitForm);
    fotoInput.addEventListener('change', handleImagePreview);
  
    await carregarOcorrencia();
});