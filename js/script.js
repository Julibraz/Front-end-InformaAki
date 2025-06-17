const form = document.getElementById('auth-form');
const toggleLink = document.getElementById('toggle-link');
const toggleText = document.getElementById('toggle-text');
const formTitle = document.getElementById('form-title');
const nomeInput = document.getElementById('nome');

let modoLogin = true;

//Função para mostrar notificação
function showNotification(message, isError = false) {
  const notification = document.getElementById('notification');
  const notificationMessage = document.getElementById('notification-message');
  
  notification.className = isError ? 'notification error' : 'notification success';
  notificationMessage.textContent = message;
  notification.classList.remove('hidden');
  
  setTimeout(() => {
    notification.classList.add('hidden');
  }, 3000);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  const nome = nomeInput.value;

  const rota = modoLogin ? '/api/usuarios/login' : '/api/usuarios/cadastrar';
  const payload = modoLogin ? { email, senha } : { nome, email, senha };

  try {
    const resposta = await fetch(`http://localhost:3000${rota}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const dados = await resposta.json();

    if (!resposta.ok) throw new Error(dados.erro || 'Erro desconhecido');

    if (modoLogin) {
      localStorage.setItem('token', dados.token);
      localStorage.setItem('usuario', JSON.stringify(dados.usuario));
      showNotification('Login realizado com sucesso! Redirecionando...');
      setTimeout(() => {
        window.location.href = 'html/ocorrencias.html';
      }, 1500);
    } else {
      showNotification('Cadastro realizado com sucesso! Faça login.');
      toggleForm();
    }
  } catch (erro) {
    showNotification('Erro: ' + erro.message, true);
  }
});

toggleLink.addEventListener('click', (e) => {
  e.preventDefault();
  toggleForm();
});

function toggleForm() {
    modoLogin = !modoLogin;
    formTitle.textContent = modoLogin ? 'Login' : 'Cadastro';
    toggleText.innerHTML = modoLogin ?
      'Não tem conta? <a href="#" id="toggle-link">Cadastre-se</a>' :
      'Já tem conta? <a href="#" id="toggle-link">Entrar</a>';
  
    nomeInput.classList.toggle('hidden', modoLogin);
    nomeInput.required = !modoLogin; // <-- Isso resolve
  
    //Reatribuir evento ao novo link 
    document.getElementById('toggle-link').addEventListener('click', (e) => {
      e.preventDefault();
      toggleForm();
    });
  }