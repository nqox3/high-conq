/* GeoStrategy main */
(function(){
  // Session & UI helpers
  const session = JSON.parse(localStorage.getItem('gs_session')||'{}');
  const playerInfo = document.getElementById('playerInfo');
  const stateInfo = document.getElementById('stateInfo');
  const territoryKm2 = document.getElementById('territoryKm2');
  const populationEl = document.getElementById('population');
  const weatherEl = document.getElementById('weather');
  const biomeEl = document.getElementById('biome');

  const resEls = {
    wood: document.getElementById('resWood'),
    stone: document.getElementById('resStone'),
    iron: document.getElementById('resIron'),
    food: document.getElementById('resFood'),
    gold: document.getElementById('resGold'),
    oil: document.getElementById('resOil'),
  };

  const tabs = document.querySelectorAll('.tabs .tab');
  const bodies = document.querySelectorAll('.tab-body');
  tabs.forEach(t=>t.addEventListener('click', ()=>{
    tabs.forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    const id = t.dataset.tab;
    bodies.forEach(b=>b.classList.add('hidden'));
    document.getElementById('tab-'+id).classList.remove('hidden');
  }));

  // State model
  let state = JSON.parse(localStorage.getItem('gs_state')||'null') || {
    name: 'Без названия',
    flag: '🏳️',
    tactic: 'balanced',
    capital: null, // {lat,lng}
    cities: [], // [{id, name, lat,lng, radiusKm}]
    buildings: [], // [{type, cityId}]
    infantry: 0,
    ranks: [], // [{email, rank}]
    invites: [], // emails
    resources: { wood:0, stone:0, iron:0, food:0, gold:0, oil:0 },
    population: 0,
    logs: []
  };

  function save(){ localStorage.setItem('gs_state', JSON.stringify(state)); render(); }

  // Map
  const map = L.map('map').setView([30, 10], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 6,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  const cityLayer = L.layerGroup().addTo(map);
  const capitalLayer = L.layerGroup().addTo(map);

  function km2ToAreaOfCircle(rKm){ return Math.PI * rKm * rKm; }

  function render(){
    // Top chips
    if(playerInfo) playerInfo.textContent = (session.nick? session.nick : 'Гость') + (session.role? ' • '+session.role : '');
    if(stateInfo) stateInfo.textContent = `${state.flag} ${state.name}`;

    // Map markers
    cityLayer.clearLayers(); capitalLayer.clearLayers();
    state.cities.forEach(c=>{
      const m = L.circle([c.lat,c.lng], {radius: c.radiusKm*1000, weight:1, fillOpacity:0.2});
      m.bindPopup(`<strong>${c.name}</strong><br/>Радиус: ${c.radiusKm} км<br/><button onclick="window.gsDeleteCity('${c.id}')">Удалить</button>`);
      if(state.capital && c.id === state.capital.id){
        m.setStyle({color:'#ffd37a', fillColor:'#ffd37a'});
        capitalLayer.addLayer(m);
      } else {
        m.setStyle({color:'#5b8cff', fillColor:'#5b8cff'});
        cityLayer.addLayer(m);
      }
    });

    // Territory / population estimates
    const territory = state.cities.reduce((sum,c)=> sum + km2ToAreaOfCircle(c.radiusKm), 0);
    territoryKm2.textContent = Math.round(territory).toLocaleString('ru-RU') + ' км²';
    state.population = Math.round(territory*3); // very rough: 3 чел на км²
    populationEl.textContent = state.population.toLocaleString('ru-RU');

    // Weather/Biome by capital
    if(state.capital){
      const cont = detectContinent(state.capital.lat, state.capital.lng);
      const info = GS_DATA.continents[cont];
      weatherEl.textContent = info.weather;
      biomeEl.textContent = info.biomes[0];
    } else {
      weatherEl.textContent = '—';
      biomeEl.textContent = '—';
    }

    // Resources
    for(const k in state.resources){
      resEls[k].textContent = Math.floor(state.resources[k]).toLocaleString('ru-RU');
    }

    // Lists
    renderLists();
  }

  // Place city / capital
  let placeMode = null; // 'city' | 'capital'
  const placeCityBtn = document.getElementById('placeCity');
  const placeCapitalBtn = document.getElementById('placeCapital');
  if(placeCityBtn) placeCityBtn.onclick = ()=>{ placeMode='city'; };
  if(placeCapitalBtn) placeCapitalBtn.onclick = ()=>{ placeMode='capital'; };

  map.on('click', (e)=>{
    if(!placeMode) return;
    const name = prompt(placeMode==='capital' ? 'Название столицы?' : 'Название города?');
    if(!name) return;
    const radiusKm = placeMode==='capital' ? 60 : 40;
    const id = Math.random().toString(36).slice(2,9);
    const city = { id, name, lat:e.latlng.lat, lng:e.latlng.lng, radiusKm };
    state.cities.push(city);
    if(placeMode==='capital'){
      state.capital = { id, lat:city.lat, lng:city.lng };
    }
    placeMode=null; save();
  });

  // Expose delete for popup button
  window.gsDeleteCity = function(id){
    state.cities = state.cities.filter(c=>c.id!==id);
    if(state.capital && state.capital.id===id) state.capital=null;
    save();
  };

  // Save state basics
  const stateName = document.getElementById('stateName');
  const stateFlag = document.getElementById('stateFlag');
  const tacticSelect = document.getElementById('tacticSelect');
  const saveStateBtn = document.getElementById('saveState');
  const relocateBtn = document.getElementById('relocateCapital');

  if(saveStateBtn){
    saveStateBtn.onclick = ()=>{
      state.name = stateName.value || state.name;
      state.flag = stateFlag.value || state.flag;
      state.tactic = tacticSelect.value;
      log(`Обновлено: имя=${state.name}, флаг=${state.flag}, тактика=${state.tactic}`);
      save();
    };
  }
  if(relocateBtn){
    relocateBtn.onclick = ()=>{
      alert('Кликните на карте, чтобы выбрать местоположение новой столицы.');
      placeMode='capital';
    };
  }

  // Buildings
  const buildingButtons = document.querySelectorAll('[data-building]');
  const buildingsList = document.getElementById('buildingsList');
  buildingButtons.forEach(b=>b.addEventListener('click', ()=>{
    if(!state.cities.length){ alert('Сначала поставьте город.'); return; }
    const cityId = state.cities[0].id; // simple: place on first city
    const type = b.dataset.building;
    state.buildings.push({type, cityId});
    log(`Построено: ${type} в городе ${state.cities[0].name}`);
    save();
  }));

  function renderLists(){
    const citiesList = document.getElementById('citiesList');
    if(citiesList){
      citiesList.innerHTML = state.cities.map(c=>`<div class="stat"><span>🏙️ ${c.name}</span><strong>${c.radiusKm} км</strong></div>`).join('');
    }
    if(buildingsList){
      buildingsList.innerHTML = state.buildings.map(b=>{
        const city = state.cities.find(c=>c.id===b.cityId);
        return `<div class="stat"><span>🏗️ ${b.type}</span><strong>${city? city.name:'?'}</strong></div>`;
      }).join('');
    }
    const ranksList = document.getElementById('ranksList');
    if(ranksList){
      ranksList.innerHTML = state.ranks.map(r=>`<div class="stat"><span>${r.email}</span><strong>${r.rank}</strong></div>`).join('');
    }
    const diplomacyLog = document.getElementById('diplomacyLog');
    if(diplomacyLog){
      diplomacyLog.innerHTML = state.logs.slice(-20).map(x=>`<div>• ${x}</div>`).join('');
    }
  }

  // Army
  const recruitBtn = document.getElementById('recruitInfantry');
  const disbandBtn = document.getElementById('disbandInfantry');
  const infantryCount = document.getElementById('infantryCount');
  function updateArmy(){ infantryCount.textContent = state.infantry; }
  if(recruitBtn) recruitBtn.onclick = ()=>{
    const cost = GS_DATA.training.infantry.cost;
    if(state.resources.food>=cost.food && state.resources.iron>=cost.iron){
      state.resources.food -= cost.food;
      state.resources.iron -= cost.iron;
      state.infantry += GS_DATA.training.infantry.perClick;
      log(`Нанята пехота +${GS_DATA.training.infantry.perClick}`);
      save();
    } else alert('Недостаточно ресурсов.');
  };
  if(disbandBtn) disbandBtn.onclick = ()=>{
    state.infantry = Math.max(0, state.infantry - GS_DATA.training.infantry.perClick);
    log(`Распущена пехота -${GS_DATA.training.infantry.perClick}`);
    save();
  };

  // Diplomacy
  const inviteInput = document.getElementById('inviteEmail');
  const inviteBtn = document.getElementById('inviteBtn');
  const declareWarBtn = document.getElementById('declareWar');
  const offerPeaceBtn = document.getElementById('offerPeace');
  const rankChips = document.querySelectorAll('[data-rank]');

  if(inviteBtn){
    inviteBtn.onclick = ()=>{
      const email = (inviteInput.value||'').trim().toLowerCase();
      if(!email) return;
      state.invites.push(email);
      log(`Отправлено приглашение игроку: ${email}`);
      save();
      inviteInput.value='';
    };
  }
  rankChips.forEach(ch=>ch.addEventListener('click', ()=>{
    const email = prompt('Почта игрока для назначения ранга:');
    if(!email) return;
    const rank = ch.dataset.rank;
    const existing = state.ranks.find(r=>r.email===email);
    if(existing) existing.rank = rank; else state.ranks.push({email, rank});
    log(`Назначение ранга: ${email} → ${rank}`);
    save();
  }));

  if(declareWarBtn) declareWarBtn.onclick = ()=>{ log('Вы объявили войну соседнему государству. Тактика: '+state.tactic); save(); };
  if(offerPeaceBtn) offerPeaceBtn.onclick = ()=>{ log('Вы предложили мир. Ожидание ответа...'); save(); };

  function log(msg){
    const ts = new Date().toLocaleString('ru-RU');
    state.logs.push(`[${ts}] ${msg}`);
  }

  // Resource tick
  function computeYield(){
    if(!state.capital) return {wood:0,stone:0,iron:0,food:0,gold:0,oil:0};
    const cont = detectContinent(state.capital.lat, state.capital.lng);
    const info = GS_DATA.continents[cont];
    const base = GS_DATA.baseYieldPerMinute;
    const mods = info.mods;
    const buildings = state.buildings.reduce((acc,b)=>{
      const bonus = GS_DATA.buildingBonuses[b.type];
      for(const k in bonus){ acc[k] = (acc[k]||0) + bonus[k]; }
      return acc;
    }, {});
    const citiesFactor = Math.max(1, state.cities.length*0.8);
    // Global admin balance
    const balance = JSON.parse(localStorage.getItem('gs_balance')||'{}');
    const yieldMod = Number(balance.globalYield||1.0);

    const tick = {};
    for(const k in base){
      tick[k] = (base[k]*mods[k] + (buildings[k]||0)) * citiesFactor * yieldMod / 60; // per second
    }
    return tick;
  }

  function applyTick(dt){
    const y = computeYield();
    for(const k in state.resources){
      state.resources[k] += (y[k]||0) * dt;
    }
  }

  let last = performance.now();
  function loop(now){
    const dt = (now - last)/1000; // seconds
    last = now;
    applyTick(dt);
    // Update UI every ~500ms
    if(now % 500 < 16) render();
    requestAnimationFrame(loop);
  }

  // Init form defaults
  document.getElementById('stateName').value = state.name;
  document.getElementById('stateFlag').value = state.flag;
  document.getElementById('tacticSelect').value = state.tactic;

  render();
  updateArmy();
  requestAnimationFrame(loop);
})();
