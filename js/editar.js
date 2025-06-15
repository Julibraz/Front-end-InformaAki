document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const usuario = JSON.parse(localStorage.getItem('usuario'));
  
    const tipo = document.getElementById('tipo');
    const descricao = document.getElementById('descricao');
    const enderecoInput = document.getElementById('endereco');
    const form = document.getElementById('form-editar');
    const btnVoltar = document.getElementById('btn-voltar');
    const mapDiv = document.getElementById('map');
  
    let lat = null;
    let lng = null;
    let marker = null;
    const id = new URLSearchParams(window.location.search).get('id');
  
    if (!token || !id) {
      alert('Acesso inválido.');
      window.location.href = 'ocorrencias.html';
      return;
    }
  
    const map = L.map('map').setView([-14, -51], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  
    map.on('click', async (e) => {
      lat = e.latlng.lat;
      lng = e.latlng.lng;
      if (marker) marker.remove();
      marker = L.marker([lat, lng]).addTo(map);
      // Buscar endereço pelo Nominatim
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
      const res = await fetch(url);
      const data = await res.json();
      enderecoInput.value = data.display_name || '';
    });
  
    enderecoInput.addEventListener('blur', async () => {
      const endereco = enderecoInput.value;
      if (!endereco) return;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}`;
      const res = await fetch(url);
      const resultados = await res.json();
      if (resultados.length > 0) {
        lat = resultados[0].lat;
        lng = resultados[0].lon;
        map.setView([lat, lng], 16);
        if (marker) marker.remove();
        marker = L.marker([lat, lng]).addTo(map);
      }
    });
  
    async function carregarOcorrencia() {
      const res = await fetch(`http://localhost:3000/api/ocorrencias/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dados = await res.json();
  
      if (usuario.id !== dados.usuario_id && usuario.tipo !== 'admin') {
        alert('Você não tem permissão para editar esta ocorrência.');
        window.location.href = 'ocorrencias.html';
        return;
      }
  
      tipo.value = dados.tipo;
      descricao.value = dados.descricao;
      lat = dados.lat;
      lng = dados.lng;
      map.setView([lat, lng], 16);
      marker = L.marker([lat, lng]).addTo(map);
  
      // Buscar endereço a partir da lat/lng
      const resGeo = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const info = await resGeo.json();
      enderecoInput.value = info.display_name || '';
    }
  
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
      
        if (!lat || !lng) {
          alert('Selecione a localização no mapa ou insira um endereço válido.');
          return;
        }
      
        const foto = document.getElementById('foto').files[0];
        let resposta;
      
        try {
          if (foto) {
            // Envia como FormData se houver nova foto
            const formData = new FormData();
            formData.append('tipo', tipo.value);
            formData.append('descricao', descricao.value);
            formData.append('lat', lat);
            formData.append('lng', lng);
            formData.append('foto', foto);
      
            resposta = await fetch(`http://localhost:3000/api/ocorrencias/${id}`, {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${token}`
              },
              body: formData
            });
          } else {
            // Envia como JSON (content-type padrão)
            const bodyJson = {
              tipo: tipo.value,
              descricao: descricao.value,
              lat: parseFloat(lat),
              lng: parseFloat(lng)
            };
      
            resposta = await fetch(`http://localhost:3000/api/ocorrencias/${id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify(bodyJson)
            });
          }
      
          if (!resposta.ok) throw new Error('Erro ao atualizar ocorrência');
      
          alert('Ocorrência atualizada com sucesso!');
          window.location.href = `detalhes.html?id=${id}`;
        } catch (err) {
          alert('Erro: ' + err.message);
        }
      });
      
  
    btnVoltar.addEventListener('click', () => {
      window.location.href = `detalhes.html?id=${id}`;
    });
  
    await carregarOcorrencia();
  });
  