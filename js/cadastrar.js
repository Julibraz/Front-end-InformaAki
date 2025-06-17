document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario'));

  if (!token) {
    showModal('Sessão expirada', 'Sua sessão expirou. Por favor, faça login novamente.', () => {
      window.location.href = '../index.html';
    });
    return;
  }

  //elementos do formulário
  const form = document.getElementById('form-ocorrencia');
  const enderecoInput = document.getElementById('endereco');
  const btnBuscarEndereco = document.getElementById('btn-buscar-endereco');
  const btnUsarLocalizacao = document.getElementById('btn-usar-localizacao');
  const latitudeInput = document.getElementById('latitude');
  const longitudeInput = document.getElementById('longitude');
  const btnVoltar = document.getElementById('btn-voltar');
  const imagemInput = document.getElementById('imagem');
  const previewContainer = document.getElementById('preview-container');
  
  //elementos do modal
  const modal = document.getElementById('modal-confirm');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');
  const modalConfirmBtn = document.getElementById('modal-confirm-btn');
  const closeModal = document.querySelector('.close-modal');

  let map, marker;

  function initMap() {
    //centro do Brasil como fallback
    const defaultCoords = { lat: -6.761, lng: -38.231 };
    
    map = L.map('map').setView([defaultCoords.lat, defaultCoords.lng], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    //marcador inicial
    marker = L.marker([defaultCoords.lat, defaultCoords.lng], { 
      draggable: true 
    }).addTo(map)
      .bindPopup('Arraste para ajustar a localização')
      .openPopup();

    //atualiza coordenadas quando o marcador é movido
    marker.on('dragend', function() {
      const { lat, lng } = marker.getLatLng();
      updateCoords(lat, lng);
      obterEnderecoPorCoordenadas(lat, lng);
    });

    //atualiza coordenadas quando clica no mapa
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      updateCoords(lat, lng);
      obterEnderecoPorCoordenadas(lat, lng);
    });
  }
  
  //atualiza campos de coordenadas
  function updateCoords(lat, lng) {
    latitudeInput.value = lat;
    longitudeInput.value = lng;
  }
  
  //obtém endereço a partir de coordenadas
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
  
  //Busca coordenadas a partir de endereço
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
  
  //Usa a localização atual do usuário
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
  
  //Preview da imagem selecionada
  function handleImagePreview(event) {
    previewContainer.style.display = 'none';
    previewContainer.innerHTML = '';
    
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
      showModal('Formato inválido', 'Por favor, selecione um arquivo de imagem.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      previewContainer.style.display = 'block';
      previewContainer.innerHTML = `<img src="${e.target.result}" alt="Pré-visualização">`;
    }
    reader.readAsDataURL(file);
  }
  
  //modal personalizado
  function showModal(title, message, callback = null) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.style.display = 'block';
    
    modalConfirmBtn.onclick = function() {
      modal.style.display = 'none';
      if (callback) callback();
    };
  }
  
  closeModal.onclick = function() {
    modal.style.display = 'none';
  };

  window.onclick = function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
  
  async function submitForm(event) {
    event.preventDefault();
    
    const tipo = document.getElementById('tipo').value;
    const descricao = document.getElementById('descricao').value;
    const latitude = latitudeInput.value;
    const longitude = longitudeInput.value;
    const imagem = imagemInput.files[0];
    
    if (!latitude || !longitude) {
      showModal('Localização necessária', 'Por favor, selecione um local no mapa ou informe um endereço válido.');
      return;
    }
    
    const formData = new FormData();
    formData.append('tipo', tipo);
    formData.append('descricao', descricao);
    formData.append('lat', latitude);
    formData.append('lng', longitude);
    if (imagem) formData.append('imagem', imagem);
    
    try {
      const res = await fetch('http://localhost:3000/api/ocorrencias', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erro ao salvar ocorrência');
      }
      
      const novaOcorrencia = await res.json();
      showModal(
        'Sucesso!', 
        'Ocorrência registrada com sucesso.', 
        () => window.location.href = `./detalhes.html?id=${novaOcorrencia.id}`
      );
    } catch (err) {
      console.error('Erro no cadastro:', err);
      showModal('Erro', err.message || 'Ocorreu um erro ao cadastrar a ocorrência. Tente novamente.');
    }
  }
  
  btnBuscarEndereco.addEventListener('click', buscarEndereco);
  btnUsarLocalizacao.addEventListener('click', usarLocalizacaoAtual);
  btnVoltar.addEventListener('click', () => window.location.href = '../html/ocorrencias.html');
  form.addEventListener('submit', submitForm);
  imagemInput.addEventListener('change', handleImagePreview);
  
  initMap();
});