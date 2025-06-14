document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const usuario = JSON.parse(localStorage.getItem('usuario'));
  
    if (!token) {
      alert('Sessão expirada. Faça login novamente.');
      window.location.href = '../index.html';
      return;
    }
  
    const form = document.getElementById('form-ocorrencia');
    const enderecoInput = document.getElementById('endereco');
    const btnBuscarEndereco = document.getElementById('btn-buscar-endereco');
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');
    const btnVoltar = document.getElementById('btn-voltar');
  
    let map, marker;
  
    //inicia o mapa com base na localização do usuário
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      iniciarMapa(latitude, longitude);
    }, () => {
      //fallback para centro do Brasil
      iniciarMapa(-15.7801, -47.9292);
    });
  
    function iniciarMapa(lat, lng) {
      map = L.map('map').setView([lat, lng], 14);
  
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  
      marker = L.marker([lat, lng], { draggable: true }).addTo(map)
        .bindPopup('Local selecionado').openPopup();
  
      latitudeInput.value = lat;
      longitudeInput.value = lng;
  
      //Atualiza coordenadas quando o usuário clicar no mapa
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        latitudeInput.value = lat;
        longitudeInput.value = lng;
        obterEnderecoPorCoordenadas(lat, lng);
      });
    }

    
    async function obterEnderecoPorCoordenadas(lat, lon) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const dados = await res.json();
          if (dados && dados.display_name) {
            enderecoInput.value = dados.display_name;
          }
        } catch (err) {
          console.error('Erro ao buscar endereço pelo mapa:', err);
        }
      }
      
  
    //Busca o endereço digitado e centraliza no mapa
    btnBuscarEndereco.addEventListener('click', async () => {
      const endereco = enderecoInput.value;
      if (!endereco.trim()) return alert('Digite um endereço válido.');
  
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}`);
        const dados = await res.json();
  
        if (dados.length === 0) return alert('Endereço não encontrado.');
  
        const { lat, lon } = dados[0];
        map.setView([lat, lon], 16);
        marker.setLatLng([lat, lon]);
        latitudeInput.value = lat;
        longitudeInput.value = lon;
      } catch (err) {
        alert('Erro ao buscar endereço.');
        console.error(err);
      }
    });
  
    //enviando o formulário
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      const tipo = document.getElementById('tipo').value;
      const descricao = document.getElementById('descricao').value;
      const latitude = latitudeInput.value;
      const longitude = longitudeInput.value;
      const imagem = document.getElementById('imagem').files[0];
  
      if (!latitude || !longitude) {
        return alert('Selecione um local no mapa ou forneça um endereço válido.');
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
  
        if (!res.ok) throw new Error('Erro ao salvar ocorrência');
  
        const nova = await res.json();
        alert('Ocorrência registrada com sucesso!');
        window.location.href = `detalhes.html?id=${nova.id}`;
      } catch (err) {
        console.error(err);
        alert('Erro ao cadastrar ocorrência.');
      }
    });
  
    btnVoltar.addEventListener('click', () => {
      window.location.href = '../html/ocorrencias.html';
    });
  });
  