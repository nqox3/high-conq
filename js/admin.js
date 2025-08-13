// Admin panel (demo only)
(function(){
  const tabs = document.querySelectorAll('.tabs .tab');
  const bodies = document.querySelectorAll('.tab-body');
  tabs.forEach(t=>t.addEventListener('click', ()=>{
    tabs.forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    bodies.forEach(b=>b.classList.add('hidden'));
    document.getElementById('tab-'+t.dataset.tab).classList.remove('hidden');
  }));

  const usersList = document.getElementById('usersList');
  const adminLog = document.getElementById('adminLog');

  function getUsers(){ return JSON.parse(localStorage.getItem('gs_users')||'[]'); }
  function saveUsers(arr){ localStorage.setItem('gs_users', JSON.stringify(arr)); }

  function renderUsers(){
    const users = getUsers();
    usersList.innerHTML = users.map(u=>`
      <div class="stat">
        <span>${u.nick||'Без ника'} • ${u.email}</span>
        <span class="row gap-sm">
          <button class="btn soft" data-role="${u.email}">${u.role||'user'}</button>
          <button class="btn danger" data-delete="${u.email}">Удалить</button>
        </span>
      </div>`).join('');
    usersList.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click', ()=>{
      const email = b.getAttribute('data-delete');
      const arr = getUsers().filter(x=>x.email!==email);
      saveUsers(arr);
      log(`Удалён пользователь: ${email}`);
      renderUsers();
    }));
    usersList.querySelectorAll('[data-role]').forEach(b=>b.addEventListener('click', ()=>{
      const email = b.getAttribute('data-role');
      const arr = getUsers();
      const u = arr.find(x=>x.email===email);
      if(u){ u.role = (u.role==='admin'?'user':'admin'); saveUsers(arr); log(`Роль переключена: ${email} → ${u.role}`); renderUsers(); }
    }));
  }

  const yieldInput = document.getElementById('globalYield');
  const combatModInput = document.getElementById('combatMod');
  const saveBalanceBtn = document.getElementById('saveBalance');

  function loadBalance(){
    const b = JSON.parse(localStorage.getItem('gs_balance')||'{}');
    if(b.globalYield) yieldInput.value = b.globalYield;
    if(b.combatMod) combatModInput.value = b.combatMod;
  }
  function saveBalance(){
    localStorage.setItem('gs_balance', JSON.stringify({
      globalYield: Number(yieldInput.value||1.0),
      combatMod: Number(combatModInput.value||1.0)
    }));
    log('Сохранён баланс: добыча=' + yieldInput.value + ', бой=' + combatModInput.value);
  }

  function log(msg){
    const ts = new Date().toLocaleString('ru-RU');
    adminLog.innerHTML += `<div>• [${ts}] ${msg}</div>`;
  }

  if(saveBalanceBtn) saveBalanceBtn.onclick = saveBalance;

  renderUsers();
  loadBalance();
})();
