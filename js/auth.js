// Simple auth with localStorage (demo only)
(function(){
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const demoBtn = document.getElementById('demoBtn');
  const rememberMe = document.getElementById('rememberMe');

  function switchTab(tab){
    if(tab === 'login'){
      tabLogin.classList.add('active'); tabRegister.classList.remove('active');
      loginForm.classList.remove('hidden'); registerForm.classList.add('hidden');
    } else {
      tabRegister.classList.add('active'); tabLogin.classList.remove('active');
      registerForm.classList.remove('hidden'); loginForm.classList.add('hidden');
    }
  }
  if(tabLogin && tabRegister){
    tabLogin.onclick = ()=>switchTab('login');
    tabRegister.onclick = ()=>switchTab('register');
  }

  function getUsers(){ return JSON.parse(localStorage.getItem('gs_users')||'[]'); }
  function saveUsers(arr){ localStorage.setItem('gs_users', JSON.stringify(arr)); }

  if(demoBtn){
    demoBtn.addEventListener('click', (e)=>{
      e.preventDefault();
      const users = getUsers();
      const exists = users.find(u=>u.email==='demo@geo' );
      if(!exists){
        users.push({email:'demo@geo', password:'demo123', nick:'Demo', role:'admin'});
        saveUsers(users);
      }
      localStorage.setItem('gs_session', JSON.stringify({email:'demo@geo', nick:'Demo', role:'admin', remember:true}));
      location.href = 'game.html';
    });
  }

  if(loginForm){
    loginForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim().toLowerCase();
      const password = document.getElementById('loginPassword').value;
      const users = getUsers();
      const user = users.find(u=>u.email===email && u.password===password);
      if(!user){ alert('Неверная почта или пароль'); return; }
      localStorage.setItem('gs_session', JSON.stringify({email:user.email, nick:user.nick, role:user.role||'user', remember:rememberMe.checked}));
      location.href = 'game.html';
    });
  }

  if(registerForm){
    registerForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const nick = document.getElementById('regNick').value.trim();
      const email = document.getElementById('regEmail').value.trim().toLowerCase();
      const p1 = document.getElementById('regPassword').value;
      const p2 = document.getElementById('regPassword2').value;
      if(p1!==p2){ alert('Пароли не совпадают'); return; }
      const users = getUsers();
      if(users.find(u=>u.email===email)){ alert('Пользователь с такой почтой уже есть'); return; }
      users.push({email, password:p1, nick, role:'user'});
      saveUsers(users);
      alert('Аккаунт создан! Теперь войдите.');
      switchTab('login');
    });
  }
})();
