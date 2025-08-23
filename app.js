// Fetch categories and build searchable dropdown
const state = {
  data: {},
  flat: [],
  open: false,
  activeIndex: -1
};

const combo = document.getElementById('combo');
const input = document.getElementById('categoryTypeInput');
const list = document.getElementById('combo-list');
const toggleBtn = document.getElementById('toggleBtn');
const commissionBox = document.getElementById('commissionBox');
const fboVal = document.getElementById('fboVal');
const fbsVal = document.getElementById('fbsVal');
const hint = document.getElementById('selectionHint');

fetch('categories.json')
  .then(r => r.json())
  .then(data => {
    state.data = data;
    state.flat = flatten(data);
    renderList(state.flat);
  })
  .catch(err => {
    console.error('Не удалось загрузить categories.json', err);
  });

function flatten(data){
  const out = [];
  Object.keys(data).forEach(cat => {
    data[cat].forEach(item => {
      out.push({
        category: cat,
        type: item.type,
        fbo: item.fbo,
        fbs: item.fbs
      });
    });
  });
  return out;
}

function renderList(items){
  list.innerHTML = '';
  // group by category for grouped rendering
  const grouped = items.reduce((acc, it) => {
    acc[it.category] = acc[it.category] || [];
    acc[it.category].push(it);
    return acc;
  }, {});

  Object.keys(grouped).forEach(cat => {
    const g = document.createElement('div');
    g.className = 'group';

    const title = document.createElement('div');
    title.className = 'group-title';
    title.innerHTML = `<span>${cat}</span>`;
    g.appendChild(title);

    grouped[cat].forEach((it, idx) => {
      const el = document.createElement('div');
      el.className = 'type-item';
      el.setAttribute('role','option');
      el.textContent = it.type;

      const badge = document.createElement('span');
      badge.className = 'badge';
      const fboTxt = (it.fbo ?? '—');
      const fbsTxt = (it.fbs ?? '—');
      badge.textContent = `FBO ${fboTxt}% • FBS ${fbsTxt}%`;
      el.appendChild(badge);

      el.addEventListener('click', () => selectItem(it));
      g.appendChild(el);
    });

    list.appendChild(g);
  });
}

function openList(){
  combo.classList.add('open');
  input.setAttribute('aria-expanded','true');
  state.open = true;
}
function closeList(){
  combo.classList.remove('open');
  input.setAttribute('aria-expanded','false');
  state.open = false;
}

toggleBtn.addEventListener('click', () => {
  state.open ? closeList() : openList();
});

input.addEventListener('focus', openList);

input.addEventListener('input', () => {
  const q = input.value.trim().toLowerCase();
  const filtered = state.flat.filter(it => 
    it.type.toLowerCase().includes(q) || 
    it.category.toLowerCase().includes(q)
  );
  renderList(filtered);
  if(!state.open) openList();
});

input.addEventListener('keydown', (e) => {
  const options = Array.from(list.querySelectorAll('.type-item'));
  if(e.key === 'ArrowDown'){
    e.preventDefault();
    state.activeIndex = Math.min(options.length-1, state.activeIndex+1);
    highlight(options);
  } else if(e.key === 'ArrowUp'){
    e.preventDefault();
    state.activeIndex = Math.max(0, state.activeIndex-1);
    highlight(options);
  } else if(e.key === 'Enter'){
    e.preventDefault();
    if(state.activeIndex >= 0 && options[state.activeIndex]){
      options[state.activeIndex].click();
    }
  } else if(e.key === 'Escape'){
    closeList();
  }
});

function highlight(options){
  options.forEach((el, i) => {
    el.setAttribute('aria-selected', i === state.activeIndex ? 'true' : 'false');
    if(i === state.activeIndex){
      el.scrollIntoView({block:'nearest'});
    }
  });
}

function selectItem(it){
  input.value = it.type;
  closeList();
  hint.textContent = `Категория: ${it.category} • Тип: ${it.type}`;
  fboVal.textContent = (it.fbo ?? '—');
  fbsVal.textContent = (it.fbs ?? '—');
  commissionBox.hidden = false;
}

// Close popup when clicking outside
document.addEventListener('click', (e) => {
  if(!combo.contains(e.target)){
    closeList();
  }
});
